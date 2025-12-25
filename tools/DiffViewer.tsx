import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { GitCompare, ArrowRightLeft, FileCode, CheckCircle2 } from 'lucide-react';

type DiffPart = {
  type: 'same' | 'added' | 'removed';
  value: string;
};

const computeDiff = (text1: string, text2: string): DiffPart[] => {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  
  const matrix: number[][] = Array(lines1.length + 1).fill(null).map(() => Array(lines2.length + 1).fill(0));
  
  for (let i = 1; i <= lines1.length; i++) {
    for (let j = 1; j <= lines2.length; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  const diff: DiffPart[] = [];
  let i = lines1.length;
  let j = lines2.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diff.unshift({ type: 'same', value: lines1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      diff.unshift({ type: 'added', value: lines2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      diff.unshift({ type: 'removed', value: lines1[i - 1] });
      i--;
    }
  }

  return diff;
};

export const DiffViewer: React.FC = () => {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [diffResult, setDiffResult] = useState<DiffPart[]>([]);

  useEffect(() => {
    if (!original && !modified) {
      setDiffResult([]);
      return;
    }
    const diff = computeDiff(original, modified);
    setDiffResult(diff);
  }, [original, modified]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-6">
      
      {/* Input Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-1/2 min-h-[300px]">
        <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center gap-2 px-1">
                <FileCode className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Source</span>
            </div>
            <div className="flex-1 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-lg">
                <textarea
                    className="w-full h-full bg-transparent border-none p-4 resize-none focus:ring-0 font-mono text-xs md:text-sm text-slate-300 leading-relaxed custom-scrollbar placeholder-slate-700"
                    placeholder="// Paste original code here..."
                    value={original}
                    onChange={(e) => setOriginal(e.target.value)}
                    spellCheck={false}
                />
            </div>
        </div>

        <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center gap-2 px-1">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400/80 uppercase tracking-wider">Modified Source</span>
            </div>
            <div className="flex-1 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-lg">
                <textarea
                    className="w-full h-full bg-transparent border-none p-4 resize-none focus:ring-0 font-mono text-xs md:text-sm text-slate-300 leading-relaxed custom-scrollbar placeholder-slate-700"
                    placeholder="// Paste modified code here..."
                    value={modified}
                    onChange={(e) => setModified(e.target.value)}
                    spellCheck={false}
                />
            </div>
        </div>
      </div>

      {/* Diff Output */}
      <div className="flex-1 min-h-0 flex flex-col gap-2">
         <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <GitCompare className="w-4 h-4" /> Comparison Result
            </span>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Added
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Removed
              </span>
            </div>
         </div>
         
         <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar p-4 font-mono text-xs md:text-sm">
                {(!original && !modified) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                        <ArrowRightLeft className="w-6 h-6 opacity-50" />
                    </div>
                    <p>Enter text above to generate a diff.</p>
                </div>
                ) : (
                <div className="flex flex-col min-w-max">
                    {diffResult.map((part, index) => (
                    <div 
                        key={index}
                        className={`flex group border-l-[3px] ${
                        part.type === 'added' ? 'bg-emerald-500/10 text-emerald-100 border-emerald-500' :
                        part.type === 'removed' ? 'bg-rose-500/10 text-rose-200 border-rose-500 opacity-60' :
                        'text-slate-400 border-transparent hover:bg-white/5'
                        }`}
                    >
                        <div className="w-10 flex-shrink-0 select-none text-right pr-3 py-0.5 text-[10px] opacity-30 border-r border-white/5 mr-3 bg-white/5 flex items-center justify-end">
                            {index + 1}
                        </div>
                        <div className="w-6 flex-shrink-0 select-none text-center py-0.5 opacity-50 font-bold">
                            {part.type === 'added' ? '+' : part.type === 'removed' ? '-' : ''}
                        </div>
                        <pre className="flex-1 whitespace-pre-wrap break-all py-0.5 pr-4">{part.value || ' '}</pre>
                    </div>
                    ))}
                </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};