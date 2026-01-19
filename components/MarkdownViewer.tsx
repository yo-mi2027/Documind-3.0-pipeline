import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, FileText, Code, Download } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `documind_result_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!content) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center border-2 border-dashed border-slate-200 rounded-lg">
        <FileText className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium">No content generated yet</p>
        <p className="text-sm mt-1">Upload files and start processing to see results here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'raw'
                ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
             <span className="flex items-center gap-1.5"><Code className="w-3 h-3" /> Raw Markdown</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 transition-colors border border-transparent hover:border-slate-200 rounded-md"
            title="Download .md file"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1"></div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto p-6 bg-white custom-scrollbar">
        {activeTab === 'preview' ? (
          <div className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-2 prose-td:border prose-td:border-slate-300 prose-td:p-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-100 h-full overflow-auto">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};