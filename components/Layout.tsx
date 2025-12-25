import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, Settings, Search, Command, Menu, Pin, PinOff, PanelLeftClose, PanelLeftOpen, Star } from 'lucide-react';
import { tools, getToolById } from '../tools/registry';
import { LightRays } from './LightRays';
import { SettingsModal } from './SettingsModal';
import { useAppContext } from '../contexts/AppContext';
import { db, STORES } from '../utils/db';

interface AppPreferences {
  showRays: boolean;
  showNoise: boolean;
}

export const Layout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { pinnedToolIds } = useAppContext();
  
  // State for sidebar interaction - Default to false (closed)
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<AppPreferences>({ showRays: true, showNoise: true });

  // Load Preferences from IDB
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const saved = await db.get<AppPreferences>(STORES.SETTINGS, 'visual_prefs');
        if (saved) {
          setPreferences(saved);
        }
        
        // Load sidebar state
        const savedSidebar = await db.get<boolean>(STORES.SETTINGS, 'sidebar_pinned');
        if (savedSidebar !== undefined) {
           setIsPinned(savedSidebar);
        }
      } catch (e) {
        console.error("Failed to load preferences", e);
      }
    };
    loadPrefs();
  }, []);

  const updatePreferences = (key: string, value: boolean) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      db.set(STORES.SETTINGS, 'visual_prefs', next).catch(console.error);
      return next;
    });
  };

  const handleSetPinned = (value: boolean) => {
    setIsPinned(value);
    db.set(STORES.SETTINGS, 'sidebar_pinned', value).catch(console.error);
  };

  // Determine if sidebar is visible (Pinned OR Hovered OR Mobile Open)
  const isSidebarVisible = isPinned || isHovered || isMobileOpen;

  // Handle Resize: Auto-unpin on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsPinned(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pinnedTools = pinnedToolIds
    .map(id => getToolById(id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const displayedTools = searchQuery 
    ? Object.values(tools).filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : Object.values(tools);

  return (
    <div className="flex h-screen w-full bg-transparent text-slate-100 font-sans overflow-hidden relative">
      
      {/* Dynamic Background Effects */}
      {preferences.showRays && (
        <LightRays 
           raysColor="#6366f1" 
           raysSpeed={0.5} 
           mouseInfluence={0.2} 
           raysOrigin="top-center"
        />
      )}
      
      {preferences.showNoise && (
         <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none" 
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
         />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={updatePreferences}
      />

      {/* 1. EDGE TRIGGER ZONE (Desktop Only) */}
      <div 
        className={`fixed top-0 left-0 h-full w-6 z-40 hidden md:block transition-colors ${!isSidebarVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onMouseEnter={() => !isPinned && setIsHovered(true)}
      />

      {/* 2. FLOATING TOGGLE BUTTON */}
      <button 
        onClick={() => handleSetPinned(true)}
        className={`fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-slate-900/40 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800/60 shadow-lg transition-all duration-500 ease-out transform ${isSidebarVisible ? '-translate-x-20 opacity-0' : 'translate-x-0 opacity-100'}`}
        title="Open Sidebar"
      >
        <PanelLeftOpen className="w-5 h-5" />
      </button>

      {/* 3. SIDEBAR */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-72 z-50 
          flex flex-col 
          bg-slate-950/60 backdrop-blur-2xl border-r border-white/10 shadow-2xl shadow-black/50
          transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Sidebar Header */}
        <div className="relative p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/10">
              <Command className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white drop-shadow-md">YeahTOOls</span>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest">Ultimate Suite</span>
            </div>
          </div>

          <div className="flex gap-1">
             <button 
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden p-2 text-slate-400 hover:text-white"
             >
                <PanelLeftClose className="w-5 h-5" />
             </button>

             <button
               onClick={() => handleSetPinned(!isPinned)}
               className={`hidden md:flex p-1.5 rounded-lg transition-all ${isPinned ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
               title={isPinned ? "Unpin Sidebar (Overlay Mode)" : "Pin Sidebar (Dock Mode)"}
             >
               {isPinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
             </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="px-6 mb-2">
          <div className="relative group">
             <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors z-10" />
             <input 
               type="text" 
               placeholder="Search tools..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="relative z-10 w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900/50 transition-all shadow-inner"
             />
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pt-4">
          <NavLink 
            to="/" 
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-indigo-600/10 border border-indigo-500/20 rounded-xl shadow-[0_0_20px_-5px_rgba(79,70,229,0.3)]" />
                )}
                <LayoutGrid className={`w-4 h-4 relative z-10 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="relative z-10">Dashboard</span>
              </>
            )}
          </NavLink>

          {/* Pinned Tools Section - Only show when not searching */}
          {!searchQuery && pinnedTools.length > 0 && (
            <div className="animate-fade-in">
              <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                <Star className="w-3 h-3 fill-current" /> Pinned Tools
              </div>
              {pinnedTools.map((tool) => (
                <NavLink 
                  key={`pinned-${tool.id}`}
                  to={`/tool/${tool.id}`} 
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                      isActive 
                        ? 'text-white' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 rounded-r-xl" />
                      )}
                      <tool.icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'}`} />
                      <span className="relative z-10">{tool.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {searchQuery ? 'Search Results' : 'All Tools'}
          </div>
          
          {displayedTools.slice(0, searchQuery ? 20 : 10).map((tool) => (
             <NavLink 
             key={tool.id}
             to={`/tool/${tool.id}`} 
             onClick={() => setIsMobileOpen(false)}
             className={({ isActive }) => 
               `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                 isActive 
                   ? 'text-white' 
                   : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
               }`
             }
           >
             {({ isActive }) => (
               <>
                 {isActive && (
                   <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500 rounded-r-xl" />
                 )}
                 <tool.icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                 <span className="relative z-10">{tool.name}</span>
               </>
             )}
           </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="relative p-4 border-t border-white/5 bg-black/20">
           <button 
             onClick={() => {
               setIsSettingsOpen(true);
               setIsMobileOpen(false);
             }}
             className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
           >
             <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
             Settings
           </button>
           
           <div className="mt-3 text-[10px] text-slate-500 text-center font-medium tracking-wide opacity-80 hover:opacity-100 transition-opacity">
              Created by <a href="https://www.instagram.com/slashz6_/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-all drop-shadow-[0_0_3px_rgba(129,140,248,0.5)]">SlashZ</a> with Gemini
           </div>
        </div>
      </aside>

      {/* 4. MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 z-40 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Command className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">YeahTOOls</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-slate-300 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* 5. MAIN CONTENT AREA */}
      <main 
        className="flex-1 overflow-y-auto relative z-10 custom-scrollbar transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ 
          paddingLeft: isPinned && window.innerWidth >= 768 ? '18rem' : '0' 
        }}
      >
        <div className={`md:py-8 md:pr-8 p-4 pt-20 h-full transition-all duration-300 ${isPinned ? 'md:pl-8' : 'md:pl-20'}`}>
           <div className="max-w-7xl mx-auto h-full pb-10">
              <Outlet />
           </div>
        </div>
      </main>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
};