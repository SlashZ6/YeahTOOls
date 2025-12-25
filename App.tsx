import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { getToolById } from './tools/registry';
import { ArrowLeft, Pin } from 'lucide-react';
import { AppProvider, useAppContext } from './contexts/AppContext';

// Wrapper component to render a specific tool
const ToolLoader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isPinned, togglePin, recordToolUsage } = useAppContext();
  const tool = id ? getToolById(id) : undefined;

  useEffect(() => {
    if (tool) {
      recordToolUsage(tool.id);
    }
  }, [tool?.id]);

  if (!tool) {
    return <div className="text-center py-20 text-slate-400">Tool not found</div>;
  }

  const Component = tool.component;
  const pinned = isPinned(tool.id);

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="flex items-center justify-between pb-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-600 group shadow-lg shadow-black/20"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <tool.icon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">{tool.name}</h2>
              <p className="text-sm text-slate-400">{tool.description}</p>
            </div>
          </div>

          <button
            onClick={() => togglePin(tool.id)}
            className={`p-2.5 rounded-xl transition-all duration-300 border ${
              pinned 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={pinned ? "Unpin Tool" : "Pin Tool"}
          >
            <Pin className={`w-5 h-5 ${pinned ? 'fill-current' : ''}`} />
          </button>
       </div>
       <div className="min-h-[400px]">
          <Component />
       </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tool/:id" element={<ToolLoader />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;