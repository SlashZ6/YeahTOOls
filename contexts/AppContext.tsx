import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, STORES } from '../utils/db';

interface AppContextType {
  pinnedToolIds: string[];
  recentToolIds: string[];
  toolUsage: Record<string, number>;
  isLoading: boolean;
  togglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
  recordToolUsage: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [pinnedToolIds, setPinnedToolIds] = useState<string[]>([]);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [toolUsage, setToolUsage] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load Data from IndexedDB on Mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const [pinned, recent, usage] = await Promise.all([
          db.get<string[]>(STORES.USER_DATA, 'pinned_tools'),
          db.get<string[]>(STORES.USER_DATA, 'recent_tools'),
          db.get<Record<string, number>>(STORES.USER_DATA, 'tool_usage')
        ]);

        if (pinned) setPinnedToolIds(pinned);
        if (recent) setRecentToolIds(recent);
        if (usage) setToolUsage(usage);
      } catch (error) {
        console.error("Failed to load app data from DB:", error);
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
  }, []);

  const togglePin = async (id: string) => {
    setPinnedToolIds(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      // Async update DB
      db.set(STORES.USER_DATA, 'pinned_tools', next).catch(console.error);
      return next;
    });
  };

  const isPinned = (id: string) => pinnedToolIds.includes(id);

  const recordToolUsage = (id: string) => {
    // Update Recents (Move to top, keep max 10)
    setRecentToolIds(prev => {
      const filtered = prev.filter(p => p !== id);
      const next = [id, ...filtered].slice(0, 10);
      db.set(STORES.USER_DATA, 'recent_tools', next).catch(console.error);
      return next;
    });

    // Update Usage Count
    setToolUsage(prev => {
      const next = {
        ...prev,
        [id]: (prev[id] || 0) + 1
      };
      db.set(STORES.USER_DATA, 'tool_usage', next).catch(console.error);
      return next;
    });
  };

  return (
    <AppContext.Provider value={{ 
      pinnedToolIds, 
      recentToolIds, 
      toolUsage, 
      isLoading,
      togglePin, 
      isPinned, 
      recordToolUsage 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};