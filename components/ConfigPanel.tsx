
import React from 'react';
import { BrainCircuit, Info } from 'lucide-react';
import { AppConfig } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  disabled: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  disabled
}) => {
  const handleChange = (field: keyof AppConfig, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6">
      
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          Model Parameters
        </h3>
        
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Model
          </label>
          <select
            value={config.model}
            onChange={(e) => handleChange('model', e.target.value)}
            disabled={disabled}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
          >
            {AVAILABLE_MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Temperature is fixed at 0.2 for optimal document accuracy.
          </p>
        </div>
      </div>

      <div className="space-y-4 h-full flex flex-col">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> System Instructions</span>
          <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
             Auto-Detect Mode
          </span>
        </h3>
        <div className="relative flex-grow min-h-[200px]">
          <textarea
            value={config.systemInstruction}
            onChange={(e) => handleChange('systemInstruction', e.target.value)}
            disabled={disabled}
            className="w-full h-full text-xs font-mono border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none bg-slate-50 leading-relaxed"
            placeholder="Enter system instructions..."
          />
          <div className="absolute bottom-2 right-2 group">
             <Info className="w-4 h-4 text-slate-400 cursor-help" />
             <div className="absolute right-0 bottom-6 w-64 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg hidden group-hover:block z-10">
               Prompts AI to automatically determine if files are a single merged document or independent items.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
