import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] border border-indigo-400/30 hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.6)] hover:-translate-y-0.5",
    secondary: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md shadow-lg shadow-black/20 hover:border-white/20 hover:text-white",
    ghost: "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-8 py-3.5 text-base gap-2.5"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Shine effect */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
      )}
      
      {icon && <span className="relative z-20 w-4 h-4">{icon}</span>}
      <span className="relative z-20">{children}</span>
    </button>
  );
};