import React, { useState, useMemo } from 'react';
import { Type, AlignLeft, Clock, FileText, Hash, LayoutList, AlignJustify } from 'lucide-react';
import { Card } from '../components/ui/Card';

export const TextAnalyzer: React.FC = () => {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { chars: 0, words: 0, sentences: 0, paragraphs: 0, readTime: 0, spaces: 0 };

    const chars = text.length;
    const words = trimmed.split(/\s+/).length;
    const sentences = trimmed.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = trimmed.split(/\n\s*\n/).filter(Boolean).length;
    const spaces = text.split(' ').length - 1;
    const readTime = Math.ceil(words / 200);

    return { chars, words, sentences, paragraphs, readTime, spaces };
  }, [text]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
      {/* Editor Section */}
      <div className="lg:col-span-2 h-full flex flex-col group">
        <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl transition-all duration-300 group-hover:border-white/20 group-hover:shadow-indigo-500/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />
          <textarea
            className="w-full h-full bg-transparent border-none focus:ring-0 p-8 text-lg text-slate-200 placeholder-slate-600 resize-none font-sans leading-relaxed custom-scrollbar"
            placeholder="Start typing or paste your text here to analyze..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="absolute bottom-4 right-6 text-xs text-slate-500 font-medium pointer-events-none">
             {text.length > 0 ? 'Analyzing...' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-2 gap-4">
           <StatBox label="Words" value={stats.words} icon={AlignLeft} color="text-indigo-400" bg="bg-indigo-500/10" border="border-indigo-500/20" />
           <StatBox label="Characters" value={stats.chars} icon={Type} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
           <StatBox label="Sentences" value={stats.sentences} icon={Hash} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" />
           <StatBox label="Paragraphs" value={stats.paragraphs} icon={AlignJustify} color="text-sky-400" bg="bg-sky-500/10" border="border-sky-500/20" />
        </div>

        <Card title="Deep Insights" className="border-t-4 border-t-slate-800">
          <div className="space-y-6">
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center border border-pink-500/20">
                  <Clock className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-0.5">Reading Time</div>
                  <div className="text-2xl font-bold text-slate-100">~{stats.readTime} <span className="text-sm font-normal text-slate-500">min</span></div>
                </div>
             </div>

             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400 flex items-center gap-2"><LayoutList className="w-4 h-4" /> Space Count</span>
                 <span className="font-mono text-slate-200">{stats.spaces}</span>
               </div>
               <div className="w-full h-px bg-white/5" />
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4" /> Avg. Word Length</span>
                 <span className="font-mono text-slate-200">
                   {(stats.words > 0 ? (stats.chars - stats.spaces) / stats.words : 0).toFixed(1)} chars
                 </span>
               </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon: Icon, color, bg, border }: any) => (
  <div className={`p-5 rounded-2xl ${bg} ${border} border backdrop-blur-sm flex flex-col items-start gap-3 transition-transform hover:-translate-y-1`}>
    <Icon className={`w-5 h-5 ${color}`} />
    <div>
      <div className="text-3xl font-bold text-slate-100 tracking-tight">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400/80 mt-1">{label}</div>
    </div>
  </div>
);