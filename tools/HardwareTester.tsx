import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Mouse, Monitor, Activity, Zap, Gamepad2 } from 'lucide-react';

const KEYS_LAYOUT = [
  ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
  ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
  ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ContextMenu', 'ControlRight']
];

export const HardwareTester: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'mouse' | 'gamepad' | 'info'>('keyboard');
  
  // Keyboard State
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>([]);

  // Mouse State
  const [mouseButtons, setMouseButtons] = useState({ 0: false, 1: false, 2: false });
  const [scrollDelta, setScrollDelta] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Gamepad State
  const [gamepads, setGamepads] = useState<(Gamepad | null)[]>([]);
  const requestRef = useRef<number>(0);

  // Event Listeners
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    setPressedKeys(prev => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
    });
    setHistory(prev => [e.code, ...prev].slice(0, 10));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
     // Optional: You can choose to keep them lit or unlight them.
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
     setMouseButtons(prev => ({ ...prev, [e.button]: true }));
  }, []);

  const handleScroll = (e: React.WheelEvent) => {
    setScrollDelta(prev => prev + e.deltaY);
  };

  // Gamepad Loop
  const scanGamepads = () => {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    setGamepads(Array.from(gps));
    requestRef.current = requestAnimationFrame(scanGamepads);
  };

  useEffect(() => {
    if (activeTab === 'keyboard') {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }
    }
    if (activeTab === 'gamepad') {
        window.addEventListener('gamepadconnected', scanGamepads);
        window.addEventListener('gamepaddisconnected', scanGamepads);
        requestRef.current = requestAnimationFrame(scanGamepads);
        return () => {
            window.removeEventListener('gamepadconnected', scanGamepads);
            window.removeEventListener('gamepaddisconnected', scanGamepads);
            cancelAnimationFrame(requestRef.current);
        };
    }
  }, [activeTab, handleKeyDown, handleKeyUp]);

  const renderKey = (code: string) => {
    const isPressed = pressedKeys.has(code);
    let label = code.replace('Key', '').replace('Digit', '');
    if (code === 'Space') label = '';
    if (code.startsWith('Arrow')) label = code.replace('Arrow', '');
    if (code === 'ControlLeft' || code === 'ControlRight') label = 'Ctrl';
    if (code === 'ShiftLeft' || code === 'ShiftRight') label = 'Shift';
    if (code === 'MetaLeft' || code === 'MetaRight') label = 'Win';
    if (code === 'AltLeft' || code === 'AltRight') label = 'Alt';
    
    let widthClass = 'w-10 md:w-12';
    if (code === 'Space') widthClass = 'w-48 md:w-64';
    if (code === 'ShiftLeft' || code === 'ShiftRight') widthClass = 'w-20 md:w-24';
    if (code === 'CapsLock' || code === 'Enter') widthClass = 'w-16 md:w-20';
    if (code === 'Tab' || code === 'Backslash') widthClass = 'w-14 md:w-16';
    if (code === 'Backspace') widthClass = 'w-16 md:w-20';

    return (
      <div 
        key={code}
        className={`
          relative flex items-center justify-center rounded-lg border-b-4 text-[10px] md:text-xs font-bold transition-all duration-75 select-none
          ${widthClass} h-10 md:h-12
          ${isPressed 
            ? 'bg-emerald-500 border-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] translate-y-1 border-b-0' 
            : 'bg-slate-800 border-slate-950 text-slate-400'
          }
        `}
      >
        {label}
      </div>
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
       {/* Tabs */}
       <div className="flex justify-center">
            <div className="flex gap-2 p-1.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-x-auto max-w-full">
                {[
                    { id: 'keyboard', icon: Keyboard, label: 'Keyboard' },
                    { id: 'mouse', icon: Mouse, label: 'Mouse' },
                    { id: 'gamepad', icon: Gamepad2, label: 'Gamepad' },
                    { id: 'info', icon: Monitor, label: 'System Info' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>
       </div>

       {/* Content */}
       <div className="flex-1 min-h-0 relative">
          {activeTab === 'keyboard' && (
              <div className="h-full flex flex-col items-center justify-center gap-8 bg-slate-900/20 rounded-3xl border border-white/5 p-4 overflow-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none rounded-3xl" />
                  
                  <div className="flex flex-col gap-3 scale-75 md:scale-100 origin-center transition-transform">
                     {KEYS_LAYOUT.map((row, i) => (
                         <div key={i} className="flex gap-2 justify-center">
                             {row.map(code => renderKey(code))}
                         </div>
                     ))}
                  </div>
                  
                  <div className="w-full max-w-2xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <Activity className="w-4 h-4" /> Live Event Log
                      </div>
                      <div className="h-16 w-full bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                          {history.length === 0 && <span className="text-slate-600 italic text-sm">Waiting for input...</span>}
                          {history.map((code, i) => (
                              <span key={i} className="shrink-0 px-2 py-1 bg-slate-800 rounded-md text-indigo-300 text-xs font-mono border border-slate-700 animate-in slide-in-from-right-2 fade-in">{code}</span>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'mouse' && (
              <div className="h-full flex flex-col">
                  <div 
                    className="flex-1 bg-slate-950/50 backdrop-blur-sm border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-3xl flex items-center justify-center relative overflow-hidden cursor-crosshair transition-colors group"
                    onMouseDown={handleMouseDown}
                    onContextMenu={(e) => { e.preventDefault(); setMouseButtons(p => ({...p, 2: true})) }}
                    onMouseMove={(e) => setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
                    onWheel={handleScroll}
                  >
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                     
                     <div className="grid grid-cols-3 gap-12 text-center relative z-10">
                        <MouseBtn label="Left Click" active={mouseButtons[0]} />
                        <MouseBtn label="Middle / Scroll" active={mouseButtons[1]} sub={scrollDelta !== 0 ? `Delta: ${scrollDelta}` : 'Idle'} />
                        <MouseBtn label="Right Click" active={mouseButtons[2]} />
                     </div>

                     <div className="absolute bottom-6 right-6 text-xs font-mono text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 backdrop-blur-md">
                        X: {mousePos.x} <span className="text-slate-600 mx-2">|</span> Y: {mousePos.y}
                     </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'gamepad' && (
              <div className="h-full bg-slate-900/40 rounded-3xl border border-white/5 p-8 flex flex-col items-center justify-center overflow-auto">
                {(!gamepads || gamepads.filter(Boolean).length === 0) ? (
                  <div className="text-center text-slate-500 space-y-4">
                     <Gamepad2 className="w-20 h-20 mx-auto opacity-20" />
                     <h3 className="text-xl font-bold">No Controller Detected</h3>
                     <p className="text-sm">Connect a USB or Bluetooth controller and press any button.</p>
                  </div>
                ) : (
                   <div className="w-full max-w-4xl space-y-10">
                     {gamepads.map((gp, i) => gp && (
                       <div key={i} className="bg-slate-950/50 rounded-2xl p-6 border border-white/10">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 bg-indigo-500 rounded text-xs font-bold text-white">#{gp.index + 1}</span>
                               <span className="font-bold text-slate-200">{gp.id.split('(')[0]}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">{gp.buttons.length} Buttons • {gp.axes.length} Axes</span>
                          </div>
                          
                          {/* Visualizer */}
                          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                             {/* Controller Graphic */}
                             <div className="relative w-[300px] h-[200px] bg-slate-800 rounded-3xl shadow-xl border-4 border-slate-700 flex items-center justify-center shrink-0">
                                {/* Left Stick Area */}
                                <div className="absolute top-1/2 left-10 -translate-y-1/2 w-20 h-20 rounded-full border border-white/10 bg-black/40">
                                   <div 
                                      className="w-10 h-10 rounded-full bg-slate-600 shadow-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                                      style={{ transform: `translate(calc(-50% + ${gp.axes[0] * 20}px), calc(-50% + ${gp.axes[1] * 20}px))` }}
                                   />
                                   {/* L3 Button */}
                                   {gp.buttons[10]?.pressed && <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-pulse" />}
                                </div>

                                {/* Right Stick Area */}
                                <div className="absolute top-1/2 right-10 -translate-y-1/2 w-20 h-20 rounded-full border border-white/10 bg-black/40">
                                   <div 
                                      className="w-10 h-10 rounded-full bg-slate-600 shadow-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                                      style={{ transform: `translate(calc(-50% + ${gp.axes[2] * 20}px), calc(-50% + ${gp.axes[3] * 20}px))` }}
                                   />
                                   {/* R3 Button */}
                                   {gp.buttons[11]?.pressed && <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-pulse" />}
                                </div>

                                {/* D-Pad */}
                                <div className="absolute bottom-6 left-24 flex flex-col items-center gap-1">
                                   <div className={`w-6 h-6 rounded ${gp.buttons[12]?.pressed ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                   <div className="flex gap-1">
                                      <div className={`w-6 h-6 rounded ${gp.buttons[14]?.pressed ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                      <div className={`w-6 h-6 rounded bg-slate-900 opacity-0`} />
                                      <div className={`w-6 h-6 rounded ${gp.buttons[15]?.pressed ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                   </div>
                                   <div className={`w-6 h-6 rounded ${gp.buttons[13]?.pressed ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                </div>

                                {/* Face Buttons */}
                                <div className="absolute top-8 right-24 grid grid-cols-3 gap-1 w-20 h-20 rotate-45">
                                   <div />
                                   <div className={`w-6 h-6 rounded-full ${gp.buttons[3]?.pressed ? 'bg-amber-500' : 'bg-slate-700'}`} /> 
                                   <div />
                                   <div className={`w-6 h-6 rounded-full ${gp.buttons[2]?.pressed ? 'bg-blue-500' : 'bg-slate-700'}`} />
                                   <div />
                                   <div className={`w-6 h-6 rounded-full ${gp.buttons[1]?.pressed ? 'bg-red-500' : 'bg-slate-700'}`} />
                                   <div />
                                   <div className={`w-6 h-6 rounded-full ${gp.buttons[0]?.pressed ? 'bg-green-500' : 'bg-slate-700'}`} />
                                   <div />
                                </div>

                                {/* Shoulder Buttons */}
                                <div className="absolute -top-3 left-8 w-16 h-4 rounded-t-lg border-2 border-slate-700 bg-slate-800 overflow-hidden">
                                   <div className={`w-full h-full ${gp.buttons[4]?.pressed ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                                </div>
                                <div className="absolute -top-3 right-8 w-16 h-4 rounded-t-lg border-2 border-slate-700 bg-slate-800 overflow-hidden">
                                   <div className={`w-full h-full ${gp.buttons[5]?.pressed ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                                </div>

                                {/* Triggers (Analog) */}
                                <div className="absolute -top-6 left-8 w-16 h-2 rounded bg-slate-900">
                                   <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${gp.buttons[6]?.value * 100}%` }} />
                                </div>
                                <div className="absolute -top-6 right-8 w-16 h-2 rounded bg-slate-900">
                                   <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${gp.buttons[7]?.value * 100}%` }} />
                                </div>
                                
                                {/* Start/Select */}
                                <div className="absolute center flex gap-4 mt-8">
                                   <div className={`w-8 h-3 rounded-full ${gp.buttons[8]?.pressed ? 'bg-white' : 'bg-slate-600'}`} />
                                   <div className={`w-8 h-3 rounded-full ${gp.buttons[9]?.pressed ? 'bg-white' : 'bg-slate-600'}`} />
                                </div>
                             </div>

                             {/* Raw Data */}
                             <div className="flex-1 bg-black/20 rounded-xl p-4 font-mono text-xs text-slate-400 grid grid-cols-2 gap-x-8 gap-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                <div className="col-span-2 font-bold text-slate-300 border-b border-white/5 pb-1 mb-1">Axes</div>
                                {gp.axes.map((val, idx) => (
                                   <div key={`ax-${idx}`} className="flex justify-between">
                                      <span>Axis {idx}</span>
                                      <span className={Math.abs(val) > 0.1 ? 'text-indigo-400' : ''}>{val.toFixed(4)}</span>
                                   </div>
                                ))}
                                <div className="col-span-2 font-bold text-slate-300 border-b border-white/5 pb-1 mb-1 mt-2">Buttons</div>
                                {gp.buttons.map((btn, idx) => (
                                   <div key={`btn-${idx}`} className="flex justify-between">
                                      <span>B{idx}</span>
                                      <span className={btn.pressed ? 'text-emerald-400 font-bold' : ''}>{btn.value.toFixed(2)}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                     ))}
                   </div>
                )}
              </div>
          )}

          {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto">
                  <InfoCard title="Screen Metrics" icon={Monitor}>
                     <InfoRow label="Window Resolution" val={`${window.innerWidth} x ${window.innerHeight}`} />
                     <InfoRow label="Screen Resolution" val={`${window.screen.width} x ${window.screen.height}`} />
                     <InfoRow label="Color Depth" val={`${window.screen.colorDepth}-bit`} />
                     <InfoRow label="Pixel Ratio" val={`${window.devicePixelRatio}x`} />
                     <InfoRow label="Orientation" val={window.screen.orientation.type} />
                  </InfoCard>

                  <InfoCard title="Browser Environment" icon={Zap}>
                     <InfoRow label="Engine" val={navigator.product} />
                     <InfoRow label="Platform" val={navigator.platform} />
                     <InfoRow label="Language" val={navigator.language} />
                     <InfoRow label="Cookies" val={navigator.cookieEnabled ? 'Enabled' : 'Disabled'} />
                     <InfoRow label="Cores" val={`${navigator.hardwareConcurrency || '?'} Logical Cores`} />
                     <div className="pt-2">
                        <div className="text-xs text-slate-500 mb-1">User Agent</div>
                        <div className="text-[10px] text-slate-400 font-mono bg-black/20 p-2 rounded-lg break-all border border-white/5">
                            {navigator.userAgent}
                        </div>
                     </div>
                  </InfoCard>
              </div>
          )}
       </div>
    </div>
  );
};

const MouseBtn = ({ label, active, sub }: any) => (
    <div className={`
        w-40 h-40 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-200
        ${active 
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
            : 'bg-slate-900/40 border-slate-700 text-slate-500'
        }
    `}>
        <div className="text-xl font-bold mb-1">{label}</div>
        {sub && <div className="text-xs opacity-70 font-mono">{sub}</div>}
        <div className={`mt-4 w-3 h-3 rounded-full ${active ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`} />
    </div>
);

const InfoCard = ({ title, icon: Icon, children }: any) => (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Icon className="w-5 h-5" /></div>
            {title}
        </h3>
        <div className="space-y-0 divide-y divide-white/5">
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, val }: any) => (
    <div className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className="text-indigo-100 font-mono text-sm bg-white/5 px-2 py-1 rounded">{val}</span>
    </div>
);