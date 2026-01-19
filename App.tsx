
import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { ConfigPanel } from './components/ConfigPanel';
import { MarkdownViewer } from './components/MarkdownViewer';
import { ProcessedFile, ProcessingStatus, AppConfig } from './types';
import { DOCUMENT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from './constants';
import { generateDocumentStream } from './services/geminiService';
import { Loader2, Play, AlertCircle, FileText, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<AppConfig>({
    // Default to Pro for maximum reasoning capability
    model: 'gemini-3-pro-preview', 
    systemInstruction: DOCUMENT_SYSTEM_PROMPT,
  });

  // Handlers
  const handleFilesSelected = (newFiles: ProcessedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearFiles = () => {
    setFiles([]);
    setResult('');
    setStatus(ProcessingStatus.IDLE);
  };

  const handleReorderFiles = (reorderedFiles: ProcessedFile[]) => {
      setFiles(reorderedFiles);
  };

  const handleAutoSort = () => {
      setFiles(prev => {
          const sorted = [...prev].sort((a, b) => 
            a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })
          );
          return sorted;
      });
  };

  const handleRun = async () => {
    if (files.length === 0) {
      setError("Please upload at least one image.");
      return;
    }

    setStatus(ProcessingStatus.OPTIMIZING);
    setError(null);
    setResult(''); 

    try {
      await generateDocumentStream(
        config.model,
        config.systemInstruction,
        files, 
        DEFAULT_TEMPERATURE,
        (msg) => {
          if (msg.includes("Optimizing")) setStatus(ProcessingStatus.OPTIMIZING);
          if (msg.includes("Initializing")) setStatus(ProcessingStatus.PREPARING);
          if (msg.includes("Receiving")) setStatus(ProcessingStatus.STREAMING);
          setProgressMsg(msg);
        },
        (chunk) => {
          setResult(prev => prev + chunk);
        }
      );
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setStatus(ProcessingStatus.ERROR);
      setError(err.message || "An unexpected error occurred during processing.");
    }
  };

  const isProcessing = status === ProcessingStatus.OPTIMIZING || status === ProcessingStatus.PREPARING || status === ProcessingStatus.STREAMING;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg">
             <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">DocuMind <span className="text-brand-600">3.0</span> Pipeline</h1>
            <p className="text-xs text-slate-500 font-medium">Context-Aware Full Digitization for Complex Documents</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {isProcessing && (
             <div className="flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium animate-pulse border border-brand-100">
               <Loader2 className="w-3 h-3 animate-spin" />
               {progressMsg || 'Processing...'}
             </div>
           )}
           <button
             onClick={handleRun}
             disabled={isProcessing || files.length === 0}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all ${
               isProcessing || files.length === 0
                 ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                 : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-lg active:transform active:scale-95'
             }`}
           >
             {isProcessing ? (
               <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
               <Play className="w-5 h-5 fill-current" />
             )}
             {isProcessing ? 'Processing...' : 'Run Analysis'}
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <div className="w-full lg:w-[400px] xl:w-[450px] bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
          <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Error</h4>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            <section>
              <ConfigPanel
                config={config}
                setConfig={setConfig}
                disabled={isProcessing}
              />
            </section>

            <div className="border-t border-slate-200 my-4" />

            <section>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-sm font-semibold text-slate-700">Input Files</h3>
                 <span className="flex items-center gap-1 text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                    <ShieldCheck className="w-3 h-3" /> Native Quality Mode
                 </span>
              </div>
              <FileUploader
                files={files}
                onFilesSelected={handleFilesSelected}
                onRemoveFile={handleRemoveFile}
                onClearAll={handleClearFiles}
                onReorder={handleReorderFiles}
                onAutoSort={handleAutoSort}
                disabled={isProcessing}
              />
            </section>
          </div>
          
          <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
             <p className="text-[10px] text-slate-500">
               Ver 1.7 • Gemini 3.0 Pro • Universal Pipeline
             </p>
          </div>
        </div>

        {/* Right Content: Output */}
        <div className="flex-grow p-6 bg-slate-100 overflow-hidden h-full">
          <div className="h-full max-w-5xl mx-auto">
             <MarkdownViewer content={result} />
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
