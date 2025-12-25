import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Pin, LayoutGrid, Clock, TrendingUp, Layers, Sparkles } from 'lucide-react';
import { getAllTools, getToolById } from '../tools/registry';
import { useAppContext } from '../contexts/AppContext';
import { Tool } from '../types';

type ViewMode = 'all' | 'category' | 'recent' | 'popular';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const allTools = getAllTools();
  const { isPinned, togglePin, recentToolIds, toolUsage } = useAppContext();
  const [viewMode, setViewMode] = useState<ViewMode>('category');

  // --- Sorting & Grouping Logic ---

  const toolsToDisplay = useMemo(() => {
    switch (viewMode) {
      case 'recent':
        return recentToolIds
          .map(id => getToolById(id))
          .filter((t): t is Tool => !!t);
      
      case 'popular':
        return [...allTools].sort((a, b) => {
          const usageA = toolUsage[a.id] || 0;
          const usageB = toolUsage[b.id] || 0;
          // Sort by usage DESC, then name ASC
          if (usageB !== usageA) return usageB - usageA;
          return a.name.localeCompare(b.name);
        });

      case 'all':
        return [...allTools].sort((a, b) => a.name.localeCompare(b.name));

      case 'category':
      default:
        // Returns all tools, we will group them in the render phase
        return allTools; 
    }
  }, [viewMode, allTools, recentToolIds, toolUsage]);

  // Grouping for 'category' view
  const groupedTools = useMemo(() => {
    if (viewMode !== 'category') return null;
    
    const groups: Record<string, Tool[]> = {};
    toolsToDisplay.forEach(tool => {
      const cat = tool.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tool);
    });
    return groups;
  }, [viewMode, toolsToDisplay]);


  // --- UI Components ---

  const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => {
    const pinned = isPinned(tool.id);
    return (
      <div 
        onClick={() => navigate(`/tool/${tool.id}`)}
        className="group relative bg-slate-900/40 border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/60 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer overflow-hidden backdrop-blur-sm h-full flex flex-col"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
              <tool.icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(tool.id);
                }}
                className={`p-2 rounded-full transition-all duration-300 ${
                  pinned 
                    ? 'text-amber-400 bg-amber-500/10 opacity-100' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/10 opacity-0 group-hover:opacity-100'
                }`}
                title={pinned ? "Unpin" : "Pin Tool"}
              >
                <Pin className={`w-4 h-4 ${pinned ? 'fill-current' : ''}`} />
              </button>

              <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-indigo-300" />
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-200 transition-colors flex items-center gap-2">
            {tool.name}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{tool.description}</p>
          
          {viewMode !== 'category' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/5 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 group-hover:text-indigo-300 transition-colors">
                {tool.category}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MoreToolsCard = () => (
    <div className="group relative w-full min-h-[180px] flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-8 p-8 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all">
       <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shrink-0 shadow-xl">
         <Sparkles className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition-colors duration-300" />
       </div>
       
       <div className="max-w-xl">
         <h3 className="text-2xl font-bold text-slate-500 group-hover:text-slate-300 transition-colors">Want more tools?</h3>
         <p className="text-sm text-slate-600 mt-2 group-hover:text-slate-500 transition-colors leading-relaxed">
           This suite is designed to be your offline-first companion. Check back consistently to see any new tools we add to the collection!
         </p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Select a tool to get started</p>
        </div>

        <div className="flex p-1 bg-slate-900 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar max-w-full">
           {[
             { id: 'category', label: 'Genre', icon: Layers },
             { id: 'all', label: 'A-Z', icon: LayoutGrid },
             { id: 'popular', label: 'Most Used', icon: TrendingUp },
             { id: 'recent', label: 'Recent', icon: Clock },
           ].map((opt) => (
             <button
               key={opt.id}
               onClick={() => setViewMode(opt.id as ViewMode)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                 viewMode === opt.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
             >
               <opt.icon className="w-4 h-4" />
               {opt.label}
             </button>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      
      {/* CASE 1: CATEGORY VIEW (Grouped) */}
      {viewMode === 'category' && groupedTools && (
        <div className="space-y-12">
           {Object.entries(groupedTools).sort((a,b) => a[0].localeCompare(b[0])).map(([category, categoryTools]: [string, Tool[]]) => (
             <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                   <h2 className="text-xl font-bold text-slate-200">{category}</h2>
                   <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                   <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded-md">{categoryTools.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {categoryTools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
                </div>
             </div>
           ))}
           
           {/* CTA at bottom of category view */}
           <div className="space-y-4 pt-8 border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
                    <MoreToolsCard />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CASE 2: OTHER VIEWS (Flat Grid) */}
      {viewMode !== 'category' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {toolsToDisplay.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
          
          {/* Show empty state for recent if empty */}
          {viewMode === 'recent' && toolsToDisplay.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
               <Clock className="w-12 h-12 mb-4 opacity-50" />
               <h3 className="text-lg font-medium text-slate-300">No Recent History</h3>
               <p className="text-sm">Start using tools to see them here.</p>
            </div>
          )}

          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <MoreToolsCard />
          </div>
        </div>
      )}

    </div>
  );
};