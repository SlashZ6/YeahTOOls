import React, { useState, useEffect, useRef, useCallback } from 'react';
import { History, Delete, X, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Math utility to handle factorials and other specific logic not native to JS Math
const factorial = (n: number): number => {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

export const SmartCalculator: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [liveResult, setLiveResult] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRad, setIsRad] = useState(true);
  const [isShift, setIsShift] = useState(false); // For 2nd function
  const [isError, setIsError] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);

  // --- Core Calculation Logic ---
  const evaluateExpression = useCallback((expr: string): string => {
    if (!expr) return '';
    
    try {
      // 1. Pre-processing replacements for UX symbols to JS Math
      let evalExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/%/g, '/100');

      // 2. Handle Implicit Multiplication (e.g., "2(" -> "2*(", "2π" -> "2*Math.PI")
      evalExpr = evalExpr.replace(/(\d)(\()/g, '$1*(');
      evalExpr = evalExpr.replace(/(\d)(Math\.)/g, '$1*Math.');
      evalExpr = evalExpr.replace(/(\))(\d)/g, ')*$2');
      evalExpr = evalExpr.replace(/(\))(\()/g, ')*(');

      // 3. Handle Factorial (!) - naive regex for simple integers
      evalExpr = evalExpr.replace(/(\d+)!/g, 'factorial($1)');

      // 4. Handle Powers
      evalExpr = evalExpr.replace(/\^/g, '**');

      // 5. Handle Root
      evalExpr = evalExpr.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
      // Simple sqrt of number without parens (e.g. √9)
      evalExpr = evalExpr.replace(/√(\d+)/g, 'Math.sqrt($1)');

      // 6. Trig Functions & Modes
      const trigMultiplier = isRad ? 1 : (Math.PI / 180);
      
      // Inject multiplier into trig arguments
      // Matches sin(number) or sin(expression)
      // Note: This is a simplified parser. Complex nested trig might require a robust AST parser, 
      // but for this scope, regex injection works for standard cases.
      const wrapTrig = (func: string, jsFunc: string) => {
         // This regex attempts to find the function call and inject the conversion factor if it's a standard number or simple paren group
         // It is safer to define a custom function in the scope of evaluation
      };

      // Instead of regex replacement for trig internals, we define helper functions 
      // in the scope of the `new Function` execution below.

      // 7. Execute
      // We create a function with a local scope containing our helpers
      const scope: any = {
        Math,
        factorial,
        sin: (x: number) => Math.sin(x * trigMultiplier),
        cos: (x: number) => Math.cos(x * trigMultiplier),
        tan: (x: number) => Math.tan(x * trigMultiplier),
        asin: (x: number) => Math.asin(x) * (isRad ? 1 : 180/Math.PI),
        acos: (x: number) => Math.acos(x) * (isRad ? 1 : 180/Math.PI),
        atan: (x: number) => Math.atan(x) * (isRad ? 1 : 180/Math.PI),
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        ln: Math.log,
        log: Math.log10,
        rand: Math.random,
      };

      // Construct a function body that destructures scope and returns eval
      const scopeKeys = Object.keys(scope);
      const scopeValues = Object.values(scope);
      
      const funcBody = `
        return (function(${scopeKeys.join(',')}) {
          try {
            return ${evalExpr};
          } catch(e) { return NaN; }
        }).apply(this, arguments);
      `;
      
      // eslint-disable-next-line no-new-func
      const result = new Function(funcBody).apply(null, scopeValues);

      if (!isFinite(result) || isNaN(result)) return 'Error';

      // Formatting: max 10 decimals, remove trailing zeros
      let fmt = parseFloat(result.toFixed(10)).toString();
      return fmt;

    } catch (e) {
      return 'Error';
    }
  }, [isRad]);

  // --- Update Live Preview ---
  useEffect(() => {
    if (!expression || expression === 'Error') {
      setLiveResult('');
      return;
    }
    // Only show live preview if expression ends in a number or closing parenthesis
    if (/[\d).!%eπ]$/.test(expression)) {
      const res = evaluateExpression(expression);
      if (res !== 'Error') {
        setLiveResult(res);
      } else {
        setLiveResult('');
      }
    } else {
      setLiveResult('');
    }
  }, [expression, evaluateExpression]);

  // --- Input Handlers ---
  const handleInput = useCallback((val: string) => {
    setIsError(false);

    if (val === 'AC') {
      setExpression('');
      setDisplay('0');
      setLiveResult('');
      return;
    }

    if (val === 'DEL') {
      setExpression(prev => prev.slice(0, -1));
      return;
    }

    if (val === '=') {
      const result = evaluateExpression(expression);
      if (result === 'Error') {
        setIsError(true);
        setDisplay('Error');
        setExpression('');
      } else {
        setHistory(prev => [`${expression} = ${result}`, ...prev].slice(0, 50));
        setExpression(result);
        setDisplay(result);
        setLiveResult(''); // Clear preview as it is now the main result
        
        // Scroll history to top
        if (historyRef.current) historyRef.current.scrollTop = 0;
      }
      return;
    }

    // Function wrappers
    if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'log', 'ln', '√'].includes(val)) {
      setExpression(prev => prev === '0' || isError ? `${val}(` : `${prev}${val}(`);
      return;
    }

    if (val === 'rand') {
      setExpression(prev => prev === '0' || isError ? `rand()` : `${prev}rand()`);
      return;
    }

    // Standard Append
    setExpression(prev => {
      if (prev === '0' && val !== '.') return val;
      if (isError) return val;
      return prev + val;
    });
  }, [expression, isError, evaluateExpression]);


  // --- Keyboard Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      if (/\d/.test(key)) handleInput(key);
      if (['+', '-', '(', ')', '.', '^', '!', '%'].includes(key)) handleInput(key);
      if (key === '*') handleInput('×');
      if (key === '/') handleInput('÷');
      if (key === 'Enter' || key === '=') { e.preventDefault(); handleInput('='); }
      if (key === 'Backspace') handleInput('DEL');
      if (key === 'Escape') handleInput('AC');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);


  // --- UI Components ---
  const Key = ({ label, type = 'num', span = 1, active = false, displayLabel }: { label: string, type?: 'num' | 'op' | 'func' | 'action', span?: number, active?: boolean, displayLabel?: string }) => {
    let baseClass = "relative overflow-hidden rounded-xl font-medium text-lg transition-all duration-100 active:scale-95 flex items-center justify-center shadow-sm select-none h-14 md:h-16";
    
    if (type === 'num') baseClass += " bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-white/5";
    if (type === 'func') baseClass += " bg-slate-800/40 hover:bg-slate-700/60 text-indigo-300 text-sm md:text-base border border-white/5";
    if (type === 'op') baseClass += " bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/20";
    if (type === 'action') baseClass += " bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20";
    
    if (active) baseClass += " ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900";
    
    return (
      <button 
        onClick={() => handleInput(label)} 
        className={`${baseClass} ${span === 2 ? 'col-span-2' : ''}`}
      >
        {displayLabel || label}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-14rem)] flex flex-col md:flex-row gap-6">
       
       {/* Left Panel: Calculator Body */}
       <div className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          
          {/* Top Bar Controls */}
          <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                 <button 
                   onClick={() => setIsRad(!isRad)} 
                   className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
                 >
                    {isRad ? 'Radians' : 'Degrees'}
                 </button>
              </div>
              <button 
                 onClick={() => setShowHistory(!showHistory)} 
                 className={`md:hidden p-2 rounded-lg transition-colors ${showHistory ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}
              >
                 <History className="w-5 h-5" />
              </button>
          </div>

          {/* Display Area */}
          <div className="flex-1 flex flex-col items-end justify-end mb-6 min-h-[120px] max-h-[200px] overflow-hidden relative">
             {/* Small Formula Text */}
             <div className="w-full text-right text-slate-500 text-sm font-mono break-all opacity-80 mb-1">
                {expression || 'Start typing...'}
             </div>
             
             {/* Main Result/Input */}
             <div className={`w-full text-right font-light tracking-wider break-all leading-tight transition-all duration-300 ${expression.length > 15 ? 'text-3xl' : 'text-5xl md:text-6xl'} ${isError ? 'text-rose-400' : 'text-white'}`}>
                {expression || '0'}
             </div>

             {/* Live Preview */}
             {liveResult && (
               <div className="absolute bottom-0 left-0 text-indigo-400 font-mono text-sm bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-2">
                  = {liveResult}
               </div>
             )}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-5 gap-3">
             {/* Row 1: Advanced Toggles & Clear */}
             <button 
                onClick={() => setIsShift(!isShift)} 
                className={`h-14 md:h-16 rounded-xl font-bold text-xs transition-all border border-white/5 flex items-center justify-center ${isShift ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800/40 text-emerald-400 hover:bg-emerald-500/10'}`}
             >
                2nd
             </button>
             <Key label="rand" type="func" displayLabel="RND" />
             <Key label="e" type="func" />
             <Key label="AC" type="action" />
             <Key label="DEL" type="action" />

             {/* Row 2: Trig & Powers */}
             <Key label={isShift ? 'asin' : 'sin'} type="func" displayLabel={isShift ? 'sin⁻¹' : 'sin'} />
             <Key label={isShift ? 'acos' : 'cos'} type="func" displayLabel={isShift ? 'cos⁻¹' : 'cos'} />
             <Key label={isShift ? 'atan' : 'tan'} type="func" displayLabel={isShift ? 'tan⁻¹' : 'tan'} />
             <Key label="^" type="func" displayLabel="xʸ" />
             <Key label="÷" type="op" />

             {/* Row 3: Misc Math */}
             <Key label={isShift ? 'sinh' : 'ln'} type="func" />
             <Key label={isShift ? 'cosh' : 'log'} type="func" />
             <Key label={isShift ? 'tanh' : '√'} type="func" />
             <Key label="!" type="func" displayLabel="x!" />
             <Key label="×" type="op" />

             {/* Row 4: Numbers */}
             <Key label="π" type="func" />
             <Key label="7" />
             <Key label="8" />
             <Key label="9" />
             <Key label="-" type="op" />

             {/* Row 5: Numbers */}
             <Key label="(" type="func" />
             <Key label="4" />
             <Key label="5" />
             <Key label="6" />
             <Key label="+" type="op" />

             {/* Row 6: Numbers & Equals */}
             <Key label=")" type="func" />
             <Key label="1" />
             <Key label="2" />
             <Key label="3" />
             <button 
                onClick={() => handleInput('=')} 
                className="row-span-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-all"
             >
               =
             </button>

             {/* Row 7: Bottom Numbers */}
             <Key label="%" type="func" />
             <Key label="0" span={2} />
             <Key label="." />
          </div>
       </div>

       {/* Right Panel: History (Desktop) / Overlay (Mobile) */}
       <div 
         className={`
           fixed md:static inset-0 z-20 md:z-auto bg-slate-900/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none
           md:w-80 flex flex-col transition-transform duration-300 md:translate-x-0
           ${showHistory ? 'translate-x-0' : 'translate-x-full'}
         `}
       >
          <div className="p-6 md:p-0 h-full flex flex-col md:bg-slate-900/20 md:border md:border-white/5 md:rounded-3xl md:backdrop-blur-lg">
             <div className="flex items-center justify-between mb-4 md:p-6 md:pb-2">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                   <History className="w-4 h-4" /> History
                </span>
                <div className="flex gap-2">
                   <button 
                      onClick={() => setHistory([])} 
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Clear History"
                   >
                      <Delete className="w-4 h-4" />
                   </button>
                   <button 
                      onClick={() => setShowHistory(false)}
                      className="md:hidden p-2 text-slate-400"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 space-y-4" ref={historyRef}>
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                     <RotateCcw className="w-8 h-8" />
                     <p className="text-sm">No calculations yet</p>
                  </div>
                ) : (
                  history.map((item, i) => (
                    <div 
                      key={i} 
                      className="group flex flex-col items-end border-b border-white/5 pb-3 last:border-0 hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => {
                         const res = item.split('=')[1].trim();
                         setExpression(res);
                         setDisplay(res);
                         setShowHistory(false); // Close on mobile
                      }}
                    >
                       <div className="text-xs text-slate-500 font-mono mb-1">{item.split('=')[0]} =</div>
                       <div className="text-lg text-indigo-300 font-mono group-hover:text-white transition-colors">{item.split('=')[1]}</div>
                    </div>
                  ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
};