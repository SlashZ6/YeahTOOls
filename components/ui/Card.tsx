import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description, actions }) => {
  return (
    <div className={`relative group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/20 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10 ${className}`}>
      
      {/* Glossy gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {(title || description || actions) && (
        <div className="relative px-6 py-5 border-b border-white/5 flex items-start justify-between bg-black/20">
          <div className="space-y-1">
            {title && <h3 className="text-lg font-semibold text-white tracking-tight drop-shadow-sm">{title}</h3>}
            {description && <p className="text-sm text-slate-400 font-medium">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      
      <div className="relative p-6">
        {children}
      </div>
    </div>
  );
};