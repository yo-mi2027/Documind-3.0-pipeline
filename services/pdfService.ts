import * as pdfjsLib from 'pdfjs-dist';

// Initialize the worker. 
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

/**
 * Generates a thumbnail preview (JPEG) for the first page of a PDF.
 * This is much faster than converting the entire document.
 */
export const getPdfThumbnail = async (pdfFile: File): Promise<string> => {
  const arrayBuffer = await pdfFile.arrayBuffer();
  
  // Load the PDF document
  // cMapUrl is still useful for correct font rendering on the cover page
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    cMapUrl: `https://esm.sh/pdfjs-dist@4.0.379/cmaps/`,
    cMapPacked: true,
  });
  
  const pdf = await loadingTask.promise;
  // Fetch only the first page
  const page = await pdf.getPage(1);
  
  // Generate a small thumbnail (scale 1.0 is usually sufficient for UI preview)
  const viewport = page.getViewport({ scale: 1.0 });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }

  // Cap thumbnail size for UI performance
  const MAX_THUMB_SIZE = 600;
  let finalScale = 1.0;
  if (viewport.width > MAX_THUMB_SIZE || viewport.height > MAX_THUMB_SIZE) {
     finalScale = Math.min(MAX_THUMB_SIZE / viewport.width, MAX_THUMB_SIZE / viewport.height);
  }
  
  const scaledViewport = page.getViewport({ scale: finalScale });

  canvas.height = scaledViewport.height;
  canvas.width = scaledViewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: scaledViewport,
  };

  await page.render(renderContext).promise;

  // Return Base64 directly for preview URL
  return canvas.toDataURL('image/jpeg', 0.8);
};