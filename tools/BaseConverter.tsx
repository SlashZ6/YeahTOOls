import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';

type Base = 'bin' | 'oct' | 'dec' | 'hex';

interface BaseConfig {
  id: Base;
  label: string;
  radix: number;
  prefix: string;
  pattern: RegExp;
  placeholder: string;
}

const CONFIGS: BaseConfig[] = [
  { id: 'dec', label: 'Decimal', radix: 10, prefix: '', pattern: /^[0-9]*$/, placeholder: '123' },
  { id: 'hex', label: 'Hexadecimal', radix: 16, prefix: '0x', pattern: /^[0-9A-Fa-f]*$/, placeholder: '7B' },
  { id: 'bin', label: 'Binary', radix: 2, prefix: '0b', pattern: /^[0-1]*$/, placeholder: '01111011' },
  { id: 'oct', label: 'Octal', radix: 8, prefix: '0o', pattern: /^[0-7]*$/, placeholder: '173' },
];

export const BaseConverter: React.FC = () => {
  const [values, setValues] = useState<Record<Base, string>>({
    bin: '', oct: '', dec: '', hex: ''
  });
  const [copied, setCopied] = useState<Base | null>(null);

  const handleChange = (id: Base, val: string) => {
    // Validate input char
    if (!CONFIGS.find(c => c.id === id)?.pattern.test(val)) return;

    if (val === '') {
      setValues({ bin: '', oct: '', dec: '', hex: '' });
      return;
    }

    const radix = CONFIGS.find(c => c.id === id)!.radix;
    const decimal = parseInt(val, radix);

    if (isNaN(decimal)) return;

    setValues({
      dec: decimal.toString(10),
      hex: decimal.toString(16).toUpperCase(),
      bin: decimal.toString(2),
      oct: decimal.toString(8)
    });
  };

  const handleCopy = (id: Base, val: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Number Base Converter</h2>
          <p className="text-slate-400">Type in any field to instantly convert to other bases.</p>
       </div>

       <div className="grid grid-cols-1 gap-6">
          {CONFIGS.map(config => (
            <div key={config.id} className="relative group">
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all group-focus-within:border-indigo-500/50 group-focus-within:ring-1 group-focus-within:ring-indigo-500/20">
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{config.label}</label>
                     <span className="text-[10px] font-mono text-slate-600 bg-black/20 px-2 py-0.5 rounded">Base {config.radix}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     {config.prefix && <span className="text-slate-500 font-mono text-xl select-none">{config.prefix}</span>}
                     <input
                        type="text"
                        value={values[config.id]}
                        onChange={(e) => handleChange(config.id, e.target.value)}
                        placeholder={config.placeholder}
                        className="w-full bg-transparent border-none p-0 text-3xl font-mono text-white focus:ring-0 placeholder-slate-700"
                        spellCheck={false}
                     />
                     <button
                        onClick={() => handleCopy(config.id, values[config.id])}
                        className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all ml-auto"
                        title="Copy Value"
                     >
                        {copied === config.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                     </button>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};