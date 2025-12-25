import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Palette, Upload, Pipette, RefreshCw, Copy, Check, Sliders, Image as ImageIcon } from 'lucide-react';

// --- Helper Functions for Color Science ---

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Simple Color Quantization (Histogram Bucket)
const extractColors = (image: HTMLImageElement, count: number = 5): string[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  
  // Resize to speed up processing
  const scale = Math.min(1, 200 / Math.max(image.width, image.height));
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const colorMap: Record<string, number> = {};
  
  // Quantize: round to nearest 32
  const quantization = 32;
  
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 128) continue; // Skip transparent
    
    const r = Math.floor(data[i] / quantization) * quantization;
    const g = Math.floor(data[i+1] / quantization) * quantization;
    const b = Math.floor(data[i+2] / quantization) * quantization;
    
    const key = `${r},${g},${b}`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }
  
  // Sort by frequency
  const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
  
  // Convert back to hex
  return sorted.slice(0, count).map(([key]) => {
    const [r, g, b] = key.split(',').map(Number);
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  });
};

type SchemeType = 'analogous' | 'monochromatic' | 'triadic' | 'complementary' | 'random';

export const ColorPalette: React.FC = () => {
  const [colors, setColors] = useState<string[]>([]);
  const [baseHue, setBaseHue] = useState(Math.floor(Math.random() * 360));
  const [scheme, setScheme] = useState<SchemeType>('random');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [imageColors, setImageColors] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generatePalette();
  }, [baseHue, scheme]);

  const generatePalette = () => {
    let newColors: string[] = [];
    const s = 70; // Saturation
    const l = 50; // Lightness

    switch (scheme) {
      case 'monochromatic':
        newColors = [
          hslToHex(baseHue, s, l - 30),
          hslToHex(baseHue, s, l - 15),
          hslToHex(baseHue, s, l),
          hslToHex(baseHue, s, l + 15),
          hslToHex(baseHue, s, l + 30),
        ];
        break;
      case 'analogous':
        newColors = [
          hslToHex((baseHue - 30 + 360) % 360, s, l),
          hslToHex((baseHue - 15 + 360) % 360, s, l),
          hslToHex(baseHue, s, l),
          hslToHex((baseHue + 15) % 360, s, l),
          hslToHex((baseHue + 30) % 360, s, l),
        ];
        break;
      case 'triadic':
        newColors = [
          hslToHex(baseHue, s, l),
          hslToHex((baseHue + 120) % 360, s, l),
          hslToHex((baseHue + 240) % 360, s, l),
          hslToHex(baseHue, s * 0.5, l + 20), // Variant
          hslToHex((baseHue + 120) % 360, s * 0.5, l - 20), // Variant
        ];
        break;
      case 'complementary':
        newColors = [
          hslToHex(baseHue, s, l),
          hslToHex(baseHue, s - 20, l + 20),
          hslToHex((baseHue + 180) % 360, s, l),
          hslToHex((baseHue + 180) % 360, s - 20, l - 20),
          hslToHex(baseHue, 10, 90), // Neutral
        ];
        break;
      case 'random':
      default:
        newColors = Array(5).fill(0).map(() => 
          hslToHex(Math.floor(Math.random() * 360), 60 + Math.random() * 20, 40 + Math.random() * 20)
        );
        break;
    }
    setColors(newColors);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setUploadedImage(url);

    const img = new Image();
    img.onload = () => {
      const extracted = extractColors(img, 6);
      setImageColors(extracted);
    };
    img.src = url;
  };

  const copyToClipboard = (hex: string, index: number, isImage: boolean = false) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(isImage ? index + 100 : index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const pickColor = async () => {
    if (!('EyeDropper' in window)) {
      alert("Your browser doesn't support the EyeDropper API.");
      return;
    }
    try {
      // @ts-ignore
      const dropper = new EyeDropper();
      const result = await dropper.open();
      // Add picked color to the start of the current palette temporarily
      setColors(prev => [result.sRGBHex, ...prev.slice(0, 4)]);
    } catch (e) {
      console.log('EyeDropper canceled');
    }
  };

  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar pr-2">
      
      {/* Generator Section */}
      <Card title="Generator" actions={
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={pickColor} icon={<Pipette className="w-3 h-3"/>}>
            Pick Screen Color
          </Button>
          <Button size="sm" variant="primary" onClick={() => { 
            if (scheme === 'random') generatePalette(); 
            else setBaseHue(Math.floor(Math.random() * 360));
          }} icon={<RefreshCw className="w-3 h-3"/>}>
            Regenerate
          </Button>
        </div>
      }>
        <div className="space-y-6">
           <div className="flex flex-wrap gap-2">
             {['random', 'analogous', 'monochromatic', 'triadic', 'complementary'].map((s) => (
                <button
                  key={s}
                  onClick={() => setScheme(s as SchemeType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    scheme === s 
                    ? 'bg-indigo-500 text-white border-indigo-400' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
             ))}
           </div>

           {scheme !== 'random' && (
             <div className="space-y-2">
               <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-bold">
                 <span>Base Hue</span>
                 <span>{baseHue}°</span>
               </div>
               <input 
                 type="range" min="0" max="360" 
                 value={baseHue} 
                 onChange={(e) => setBaseHue(Number(e.target.value))}
                 className="w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
               />
             </div>
           )}

           <div className="h-40 md:h-56 flex rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              {colors.map((hex, i) => (
                <div 
                  key={i}
                  className="flex-1 flex flex-col justify-end group relative transition-all hover:flex-[1.5]"
                  style={{ backgroundColor: hex }}
                  onClick={() => copyToClipboard(hex, i)}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors cursor-pointer" />
                  
                  <div className="p-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 text-center">
                    <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-mono font-bold shadow-lg">
                       {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                       {hex}
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </Card>

      {/* Image Extraction Section */}
      <Card title="Extract from Image">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div 
             className="relative aspect-video rounded-xl bg-slate-900/50 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
             onClick={() => fileInputRef.current?.click()}
           >
              {uploadedImage ? (
                <>
                  <img src={uploadedImage} className="w-full h-full object-contain" alt="Uploaded" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <span className="text-white font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Change Image</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                     <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-slate-400 font-medium">Click to upload image</div>
                </>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
           </div>

           <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dominant Colors</h3>
              {imageColors.length > 0 ? (
                <div className="space-y-3">
                   {imageColors.map((hex, i) => (
                     <div 
                       key={i + 100}
                       onClick={() => copyToClipboard(hex, i, true)}
                       className="flex items-center gap-4 p-2 rounded-lg bg-slate-800/50 border border-white/5 cursor-pointer hover:bg-slate-700 transition-colors group"
                     >
                        <div className="w-12 h-12 rounded-lg shadow-sm ring-1 ring-white/10" style={{ backgroundColor: hex }} />
                        <div className="flex-1">
                           <div className="text-slate-200 font-mono text-sm font-bold">{hex}</div>
                           <div className="text-slate-500 text-xs">
                             rgb({hexToRgb(hex)?.r}, {hexToRgb(hex)?.g}, {hexToRgb(hex)?.b})
                           </div>
                        </div>
                        <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {copiedIndex === i + 100 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm italic border border-white/5 rounded-xl bg-slate-900/20">
                   Upload an image to see palette
                </div>
              )}
           </div>
        </div>
      </Card>
    </div>
  );
};