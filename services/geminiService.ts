import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ProcessedFile } from "../types";

/**
 * Prepares a file for Gemini API.
 * 
 * UPDATE: To maximize OCR accuracy, we no longer compress images.
 * We send the raw Base64 data for both PDFs and Images.
 * Gemini handles large resolutions (up to 20MB/file) very well.
 */
const prepareFileForGemini = async (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Data URL format: "data:image/jpeg;base64,/9j/4AAQSk..."
      // specific behavior: split at the first comma to separate metadata from data
      const parts = result.split(',');
      
      if (parts.length !== 2) {
          reject(new Error("Failed to process file data"));
          return;
      }

      const header = parts[0];
      const base64Data = parts[1];

      // Extract accurate mime type from the data URL header (e.g., "data:image/png;base64")
      // Fallback to file.type if parsing fails
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : file.type;

      resolve({
        data: base64Data,
        mimeType: mimeType
      });
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const generateDocumentStream = async (
  modelName: string,
  systemInstruction: string,
  files: ProcessedFile[],
  temperature: number,
  onProgress: (status: string) => void,
  onChunk: (text: string) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Preparing Files (Raw Upload)
  onProgress(`Uploading ${files.length} file(s) raw data...`);
  
  const fileParts = await Promise.all(files.map(async (f) => {
    const { data, mimeType } = await prepareFileForGemini(f.file);
    return {
      inlineData: {
        data: data,
        mimeType: mimeType,
      },
    };
  }));

  // 2. Prepare Request
  // Check if model supports Thinking Config (Gemini 3.0 and 2.5 series)
  const isThinkingModel = modelName.includes('gemini-3') || modelName.includes('gemini-2.5');
  const initMsg = isThinkingModel 
    ? "Initializing Gemini 3.0 session (Deep Thinking)..." 
    : "Initializing Gemini session...";

  onProgress(initMsg);
  
  // Universal User Prompt with Reinforcement
  const prompt = `添付したファイルセット（PDFまたは画像、計${files.length}点）を解析し、Markdownドキュメントを作成してください。

【重要指示：自動判別】
以下の基準に従って処理してください：
1. **一連の文書の場合**: 文脈を繋げ、正しい順序で統合されたドキュメントにしてください。
2. **バラバラの資料の場合**: それぞれを独立した項目（Item 1, Item 2...）としてリスト化してください。

PDFが含まれる場合は、その全ページを解析対象としてください。
入力された画像/PDFの順序に従って処理を開始してください。

【Strict Final Constraints】
1. **Original Language Preserved**: Output strictly in the original language of the document (e.g., Japanese, English). DO NOT TRANSLATE.
2. **Structure**: Follow Markdown format rigorously (headers, tables, lists).`;

  // Prepare Config
  const config: any = {
    systemInstruction: systemInstruction,
    temperature: temperature,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
  };

  if (isThinkingModel) {
    // 2048 tokens for reasoning allows the model to plan layout and structure before outputting.
    config.thinkingConfig = { thinkingBudget: 2048 };
    // maxOutputTokens limits the sum of thinking + response.
    // Increased to 65536 to prevent output truncation on long documents.
    config.maxOutputTokens = 65536; 
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: {
        parts: [
          ...fileParts,
          { text: prompt }
        ]
      },
      config: config
    });

    onProgress("Receiving logic stream...");
    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunk(c.text);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};