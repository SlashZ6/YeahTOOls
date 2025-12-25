import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { QrCode, Download, Wifi, Link, Type, Palette, Sliders, Share2 } from 'lucide-react';

declare const QRious: any;

export const QrGenerator: React.FC = () => {
  const [type, setType] = useState<'text' | 'url' | 'wifi'>('url');
  const [value, setValue] = useState('https://example.com');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiEnc, setWifiEnc] = useState('WPA');
  const [size, setSize] = useState(1000); // High res internally
  const [foreground, setForeground] = useState('#0f172a');
  const [background, setBackground] = useState('#ffffff');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    if (typeof QRious === 'undefined' || !canvasRef.current) return;

    if (!qrRef.current) {
      qrRef.current = new QRious({
        element: canvasRef.current,
        size: size,
      });
    }

    let finalValue = value;
    if (type === 'wifi') {
      finalValue = `WIFI:S:${wifiSsid};T:${wifiEnc};P:${wifiPass};;`;
    }

    qrRef.current.set({
      value: finalValue,
      size: size,
      foreground: foreground,
      background: background,
      level: 'H'
    });
  }, [value, wifiSsid, wifiPass, wifiEnc, size, foreground, background, type]);

  const downloadQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qrcode-${type}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
      
      {/* Controls Section */}
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
        {/* Type Selection */}
        <div className="grid grid-cols-3 gap-3">
           {[
             { id: 'url', label: 'Link', icon: Link },
             { id: 'wifi', label: 'WiFi', icon: Wifi },
             { id: 'text', label: 'Text', icon: Type },
           ].map(t => (
             <button
               key={t.id}
               onClick={() => setType(t.id as any)}
               className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${
                 type === t.id 
                 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                 : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-slate-200'
               }`}
             >
               <t.icon className="w-5 h-5" />
               <span className="text-sm font-medium">{t.label}</span>
             </button>
           ))}
        </div>

        {/* Input Forms */}
        <Card title="Data Configuration">
           <div className="space-y-4 animate-fade-in">
             {type === 'url' && (
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Website URL</label>
                 <input
                   type="url"
                   value={value}
                   onChange={(e) => setValue(e.target.value)}
                   className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-slate-600"
                   placeholder="https://yourwebsite.com"
                 />
               </div>
             )}
             {type === 'text' && (
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Content</label>
                 <textarea
                   value={value}
                   onChange={(e) => setValue(e.target.value)}
                   rows={4}
                   className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-slate-600 resize-none"
                   placeholder="Enter plain text..."
                 />
               </div>
             )}
             {type === 'wifi' && (
               <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Network Name (SSID)</label>
                   <input
                     type="text"
                     value={wifiSsid}
                     onChange={(e) => setWifiSsid(e.target.value)}
                     className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                     placeholder="My WiFi Network"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Password</label>
                     <input
                       type="text"
                       value={wifiPass}
                       onChange={(e) => setWifiPass(e.target.value)}
                       className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                       placeholder="Secret Key"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Encryption</label>
                     <select
                       value={wifiEnc}
                       onChange={(e) => setWifiEnc(e.target.value)}
                       className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                     >
                       <option value="WPA">WPA/WPA2</option>
                       <option value="WEP">WEP</option>
                       <option value="nopass">None</option>
                     </select>
                   </div>
                 </div>
               </div>
             )}
           </div>
        </Card>

        {/* Style Options */}
        <Card title="Customization">
           <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Colors
                 </label>
                 <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                       <span className="text-[10px] text-slate-400">Foreground</span>
                       <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <input type="color" value={foreground} onChange={e => setForeground(e.target.value)} className="w-6 h-6 rounded bg-transparent cursor-pointer" />
                          <span className="text-xs font-mono text-slate-400">{foreground}</span>
                       </div>
                    </div>
                    <div className="flex-1 space-y-2">
                       <span className="text-[10px] text-slate-400">Background</span>
                       <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <input type="color" value={background} onChange={e => setBackground(e.target.value)} className="w-6 h-6 rounded bg-transparent cursor-pointer" />
                          <span className="text-xs font-mono text-slate-400">{background}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="flex flex-col h-full gap-4">
         <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
             
             <div className="relative z-10 p-6 bg-white rounded-2xl shadow-xl transform transition-transform hover:scale-105 duration-300">
                <canvas ref={canvasRef} className="max-w-full w-48 h-48 md:w-64 md:h-64" />
             </div>
             
             <div className="mt-8 text-center space-y-1">
                <h3 className="text-white font-medium">Scan Me</h3>
                <p className="text-xs text-slate-400">Use your phone's camera</p>
             </div>
         </div>
         
         <Button onClick={downloadQr} size="lg" className="w-full shadow-lg shadow-indigo-500/20 py-4 text-base">
            <Download className="w-5 h-5" /> Download High-Res PNG
         </Button>
      </div>
    </div>
  );
};