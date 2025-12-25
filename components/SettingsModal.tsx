import React from 'react';
import { X, Zap, Monitor, Trash2 } from 'lucide-react';
import { db } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: {
    showRays: boolean;
    showNoise: boolean;
  };
  onUpdate: (key: string, value: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onUpdate }) => {
  if (!isOpen) return null;

  const handleClearData = async () => {
    if (confirm('Are you sure you want to reset all pinned items and saved preferences? This action cannot be undone.')) {
      try {
        await db.clearAll();
        localStorage.clear(); // Cleanup any legacy data just in case
        window.location.reload();
      } catch (e) {
        alert("Failed to reset data.");
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out_forwards] translate-y-4">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Visuals Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Visual Effects</h3>
            
            <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl transition-all hover:border-white/10">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Ambient Rays</div>
                    <div className="text-xs text-slate-500 mt-0.5">Dynamic background lighting</div>
                  </div>
               </div>
               <Switch checked={preferences.showRays} onChange={(v) => onUpdate('showRays', v)} />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl transition-all hover:border-white/10">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Film Grain</div>
                    <div className="text-xs text-slate-500 mt-0.5">Cinematic noise overlay</div>
                  </div>
               </div>
               <Switch checked={preferences.showNoise} onChange={(v) => onUpdate('showNoise', v)} />
            </div>
          </div>

          {/* Data Section */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data & Storage</h3>
             <button 
               onClick={handleClearData}
               className="w-full flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl transition-all group"
             >
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:text-rose-300 transition-colors">
                     <Trash2 className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <div className="text-sm font-semibold text-rose-200 group-hover:text-rose-100">Reset Application</div>
                     <div className="text-xs text-rose-500/60 group-hover:text-rose-500/80 mt-0.5">Clear pinned items and preferences</div>
                   </div>
                </div>
             </button>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-black/20 text-center border-t border-white/5">
           <p className="text-[10px] text-slate-600 font-mono tracking-wide">YeahTOOls Suite v1.2.0 • Build 2024</p>
        </div>
      </div>
    </div>
  );
};

const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${checked ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-700'}`}
  >
    <span 
      className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-spring ${checked ? 'translate-x-5' : 'translate-x-0'}`} 
    />
  </button>
);