import React, { useRef, useState } from 'react';
import { Upload, X, FileImage, Trash2, ArrowUpDown, GripVertical, FileType, Loader2 } from 'lucide-react';
import { ProcessedFile } from '../types';
import { getPdfThumbnail } from '../services/pdfService';

interface FileUploaderProps {
  files: ProcessedFile[];
  onFilesSelected: (files: ProcessedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onReorder: (files: ProcessedFile[]) => void;
  onAutoSort: () => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onFilesSelected,
  onRemoveFile,
  onClearAll,
  onReorder,
  onAutoSort,
  disabled
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (inputFiles: File[]) => {
    setIsProcessing(true);
    const newProcessedFiles: ProcessedFile[] = [];

    try {
      for (const file of inputFiles) {
        if (file.type === 'application/pdf') {
          // Native PDF Mode: Keep original file, just generate a cover thumbnail
          try {
             const previewUrl = await getPdfThumbnail(file);
             newProcessedFiles.push({
               file: file, // Keep the original PDF
               previewUrl: previewUrl,
               id: Math.random().toString(36).substring(7),
             });
          } catch (e) {
             console.error("Failed to generate PDF thumbnail", e);
             // Fallback if thumbnail fails
             newProcessedFiles.push({
               file: file,
               previewUrl: '', // Will show icon fallback
               id: Math.random().toString(36).substring(7),
             });
          }
        } else if (file.type.startsWith('image/')) {
          // Standard Image
          newProcessedFiles.push({
            file: file,
            previewUrl: URL.createObjectURL(file),
            id: Math.random().toString(36).substring(7),
          });
        }
      }
      
      onFilesSelected(newProcessedFiles);
    } catch (error) {
      console.error("Error processing files:", error);
      alert("Failed to process file.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processFiles(Array.from(event.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isProcessing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // --- Reordering Logic ---
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newFiles = [...files];
    const draggedItem = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedItem);
    
    onReorder(newFiles);
    setDraggedIndex(index);
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
  };

  const isDisabled = disabled || isProcessing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FileImage className="w-4 h-4" />
          Documents ({files.length})
        </h3>
        <div className="flex items-center gap-2">
            {files.length > 1 && (
                <button
                    onClick={onAutoSort}
                    disabled={isDisabled}
                    className="text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded border border-brand-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Sort by filename (1, 2, 10...)"
                >
                    <ArrowUpDown className="w-3 h-3" /> Auto-Sort
                </button>
            )}
            {files.length > 0 && (
            <button
                onClick={onClearAll}
                disabled={isDisabled}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded border border-transparent hover:border-red-100 flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
                <Trash2 className="w-3 h-3" /> Clear
            </button>
            )}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-brand-50 hover:border-brand-500 cursor-pointer border-slate-300'
        }`}
        onClick={() => !isDisabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg, application/pdf"
          multiple
          className="hidden"
          disabled={isDisabled}
        />
        
        {isProcessing ? (
           <div className="flex flex-col items-center justify-center py-2">
             <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-2" />
             <p className="text-sm text-brand-700 font-medium">Preparing files...</p>
           </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">
              Click or Drag Images / PDFs
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports JPG, PNG, PDF (Direct Analysis)
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
          {files.map((f, index) => (
            <div 
                key={f.id} 
                draggable={!isDisabled}
                onDragStart={(e) => handleItemDragStart(e, index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDragEnd={handleItemDragEnd}
                className={`relative group aspect-[3/4] bg-white rounded-md overflow-hidden border shadow-sm transition-all cursor-move ${
                    draggedIndex === index ? 'opacity-40 scale-95 border-brand-400' : 'border-slate-200 hover:border-brand-300'
                }`}
            >
              {f.file.type === 'application/pdf' ? (
                  f.previewUrl ? (
                    <img src={f.previewUrl} alt="PDF Cover" className="w-full h-full object-cover pointer-events-none select-none opacity-90" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                        <FileType className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-bold">PDF</span>
                    </div>
                  )
              ) : (
                <img
                    src={f.previewUrl}
                    alt={`Item ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                />
              )}
              
              {/* Badge for PDF */}
              {f.file.type === 'application/pdf' && (
                 <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm">
                    PDF
                 </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex flex-col justify-between p-1">
                  <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 text-white p-0.5 rounded cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-3 h-3" />
                      </div>
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFile(f.id);
                        }}
                        disabled={isDisabled}
                        className="bg-red-500 text-white p-0.5 rounded hover:bg-red-600"
                        >
                        <X className="w-3 h-3" />
                        </button>
                  </div>
                  
                  <div className="bg-black/60 backdrop-blur-sm p-1 rounded text-center">
                    <span className="text-white text-xs font-bold block">
                        {f.file.type === 'application/pdf' ? 'Doc' : `Img ${index + 1}`}
                    </span>
                    <span className="text-slate-200 text-[9px] truncate block w-full">{f.file.name}</span>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};