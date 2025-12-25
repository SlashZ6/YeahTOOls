import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Maximize, Minimize, Move, StretchHorizontal, Image as ImageIcon, X, Lock, Unlock, RotateCw, Palette, Droplets, Eraser } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type FitMode = 'contain' | 'cover' | 'stretch' | 'center';
type BgMode = 'transparent' | 'color' | 'blur';

interface Preset {
  label: string;
  ratio: number; // width / height
  desc: string;
}

const PRESETS: Preset[] = [
  { label: '1:1', ratio: 1, desc: 'Square (Instagram)' },
  { label: '16:9', ratio: 16/9, desc: 'Landscape (YouTube)' },
  { label: '4:5', ratio: 4/5, desc: 'Portrait (Insta Post)' },
  { label: '9:16', ratio: 9/16, desc: 'Story (TikTok/Reels)' },
  { label: '4:3', ratio: 4/3, desc: 'Standard Photo' },
  { label: '21:9', ratio: 21/9, desc: 'Ultrawide' },
];

export const AspectRatioEditor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [canvasConfig, setCanvasConfig] = useState({
    width: 1080,
    height: 1080,
    fitMode: 'contain' as FitMode,
    bgMode: 'blur' as BgMode,
    bgColor: '#ffffff',
    blurStrength: 50,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load image
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    const img = new Image();
    img.onload = () => {
      setImgElement(img);
      // Default to original size but switch to blur mode initially for nice effect
      setCanvasConfig(prev => ({
        ...prev,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fitMode: 'contain',
        bgMode: 'blur'
      }));
    };
    img.src = url;
  };

  // Drag & Drop
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  // Canvas Drawing
  useEffect(() => {
    if (!canvasRef.current || !imgElement) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvasConfig.width;
    canvas.height = canvasConfig.height;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = imgElement.naturalWidth;
    const ih = imgElement.naturalHeight;

    // 1. Draw Background
    ctx.clearRect(0, 0, cw, ch);

    if (canvasConfig.bgMode === 'color') {
      ctx.fillStyle = canvasConfig.bgColor;
      ctx.fillRect(0, 0, cw, ch);
    } 
    else if (canvasConfig.bgMode === 'blur') {
      // Create Aurora effect
      ctx.save();
      ctx.filter = `blur(${canvasConfig.blurStrength}px) saturate(150%)`;
      
      // Calculate cover dimensions for background
      const scale = Math.max(cw / iw, ch / ih);
      const bw = iw * scale;
      const bh = ih * scale;
      const bx = (cw - bw) / 2;
      const by = (ch - bh) / 2;
      
      // Draw with slight bleed to ensure blur reaches edges cleanly
      const bleed = canvasConfig.blurStrength * 2;
      ctx.drawImage(imgElement, bx - bleed, by - bleed, bw + (bleed * 2), bh + (bleed * 2));
      
      // Add a subtle dark overlay to make foreground pop
      ctx.restore(); // remove blur for overlay
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, cw, ch);
    }

    // 2. Draw Foreground Image
    let drawX = 0, drawY = 0, drawW = 0, drawH = 0;

    switch (canvasConfig.fitMode) {
      case 'contain': {
        const scale = Math.min(cw / iw, ch / ih);
        drawW = iw * scale;
        drawH = ih * scale;
        drawX = (cw - drawW) / 2;
        drawY = (ch - drawH) / 2;
        break;
      }
      case 'cover': {
        const scale = Math.max(cw / iw, ch / ih);
        drawW = iw * scale;
        drawH = ih * scale;
        drawX = (cw - drawW) / 2;
        drawY = (ch - drawH) / 2;
        break;
      }
      case 'stretch': {
        drawW = cw;
        drawH = ch;
        break;
      }
      case 'center': {
        drawW = iw;
        drawH = ih;
        drawX = (cw - drawW) / 2;
        drawY = (ch - drawH) / 2;
        break;
      }
    }
    
    // Add shadow to foreground if in contain/center mode and background is not transparent
    if (canvasConfig.bgMode !== 'transparent' && (canvasConfig.fitMode === 'contain' || canvasConfig.fitMode === 'center')) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
    }

    ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

  }, [imgElement, canvasConfig]);

  const applyPreset = (ratio: number) => {
    // Keep width, adjust height
    const newHeight = Math.round(canvasConfig.width / ratio);
    setCanvasConfig(prev => ({ ...prev, height: newHeight }));
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `edited_${file?.name || 'image'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const swapDimensions = () => {
    setCanvasConfig(prev => ({ ...prev, width: prev.height, height: prev.width }));
  };

  if (!file) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        <div 
          className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 shadow-xl">
             <ImageIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-200">Upload Image</h3>
          <p className="text-slate-500 mt-2">Drag & drop or click to browse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full lg:h-[calc(100vh-12rem)]">
      {/* Preview Pane */}
      <div className="lg:col-span-2 h-full flex flex-col">
        <Card className="flex-1 p-0 overflow-hidden relative flex items-center justify-center bg-slate-950/30 border-slate-800">
           {/* Checkerboard */}
           <div className="absolute inset-0 z-0 opacity-20" 
                style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
           </div>
           
           <div className="relative z-10 p-8 w-full h-full flex items-center justify-center overflow-auto">
              <canvas 
                 ref={canvasRef} 
                 className="max-w-full max-h-full shadow-2xl border border-slate-700/50"
                 style={{ maxHeight: 'calc(100vh - 16rem)' }} 
              />
           </div>

           <button 
             onClick={() => setFile(null)}
             className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700 backdrop-blur-sm transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </Card>
      </div>

      {/* Controls Pane */}
      <div className="space-y-6 overflow-y-auto pr-1">
        
        {/* Dimensions */}
        <Card title="Canvas Dimensions">
           <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1 block">Width (px)</label>
                <input 
                  type="number" 
                  value={canvasConfig.width}
                  onChange={(e) => setCanvasConfig(prev => ({ ...prev, width: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button 
                 onClick={swapDimensions}
                 className="p-2.5 mb-[1px] rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                 title="Swap Width/Height"
              >
                 <RotateCw className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1 block">Height (px)</label>
                <input 
                  type="number" 
                  value={canvasConfig.height}
                  onChange={(e) => setCanvasConfig(prev => ({ ...prev, height: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
           </div>

           <div className="grid grid-cols-3 gap-2">
              {PRESETS.map(p => (
                 <button
                   key={p.label}
                   onClick={() => applyPreset(p.ratio)}
                   className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
                 >
                    <span className="text-xs font-bold text-slate-300">{p.label}</span>
                    <span className="text-[10px] text-slate-500">{p.desc.split(' ')[0]}</span>
                 </button>
              ))}
           </div>
        </Card>

        {/* Fit & Layout */}
        <Card title="Image Layout">
           <div className="space-y-6">
             <div>
               <label className="text-xs text-slate-500 font-medium mb-2 block uppercase tracking-wider">Fit Mode</label>
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { id: 'contain', label: 'Contain', icon: Minimize, desc: 'Fit inside' },
                   { id: 'cover', label: 'Cover', icon: Maximize, desc: 'Fill crop' },
                   { id: 'stretch', label: 'Stretch', icon: StretchHorizontal, desc: 'Distort' },
                   { id: 'center', label: 'Center', icon: Move, desc: 'No resize' },
                 ].map((mode) => (
                   <button
                     key={mode.id}
                     onClick={() => setCanvasConfig(prev => ({ ...prev, fitMode: mode.id as FitMode }))}
                     className={`flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                       canvasConfig.fitMode === mode.id
                         ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                         : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                     }`}
                   >
                     <mode.icon className="w-4 h-4" />
                     <div className="leading-none">
                       <div className="text-sm font-medium">{mode.label}</div>
                       <div className="text-[10px] opacity-70 mt-0.5">{mode.desc}</div>
                     </div>
                   </button>
                 ))}
               </div>
             </div>

             <div>
                <label className="text-xs text-slate-500 font-medium mb-3 block uppercase tracking-wider">Background</label>
                
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 mb-4">
                   {[
                     { id: 'transparent', label: 'None', icon: Eraser },
                     { id: 'blur', label: 'Blur', icon: Droplets },
                     { id: 'color', label: 'Color', icon: Palette },
                   ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setCanvasConfig(prev => ({ ...prev, bgMode: mode.id as BgMode }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                           canvasConfig.bgMode === mode.id
                           ? 'bg-slate-800 text-white shadow-sm'
                           : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                         <mode.icon className="w-3.5 h-3.5" />
                         {mode.label}
                      </button>
                   ))}
                </div>

                {canvasConfig.bgMode === 'color' && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                     <input 
                       type="color" 
                       value={canvasConfig.bgColor}
                       onChange={(e) => setCanvasConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                       className="h-10 w-12 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                     />
                     <div className="flex-1">
                        <input 
                           type="text" 
                           value={canvasConfig.bgColor}
                           onChange={(e) => setCanvasConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm uppercase"
                        />
                     </div>
                  </div>
                )}

                {canvasConfig.bgMode === 'blur' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                     <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Blur Intensity</span>
                        <span className="text-xs font-mono text-indigo-400">{canvasConfig.blurStrength}px</span>
                     </div>
                     <input 
                       type="range" min="10" max="150" step="5"
                       value={canvasConfig.blurStrength}
                       onChange={(e) => setCanvasConfig(prev => ({ ...prev, blurStrength: Number(e.target.value) }))}
                       className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                  </div>
                )}
             </div>
           </div>
        </Card>

        <Button 
           variant="primary" 
           size="lg" 
           className="w-full"
           onClick={handleDownload}
        >
           <Download className="w-4 h-4" />
           Download Result
        </Button>

      </div>
    </div>
  );
};