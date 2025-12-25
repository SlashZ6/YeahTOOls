import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, ArrowUp, ArrowDown, Settings, Download, Image as ImageIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// @ts-ignore
import { jsPDF } from 'jspdf';

interface PdfImage {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
}

export const ImageToPdf: React.FC = () => {
  const [images, setImages] = useState<PdfImage[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'p' | 'l'>('p'); // p=portrait, l=landscape
  const [margin, setMargin] = useState(10); // mm
  const [fitMode, setFitMode] = useState<'fit' | 'cover' | 'stretch'>('fit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newImages: PdfImage[] = [];
    Array.from(e.target.files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: url,
          width: img.naturalWidth,
          height: img.naturalHeight
        }]);
      };
      img.src = url;
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    if ((index === 0 && direction === -1) || (index === images.length - 1 && direction === 1)) return;
    setImages(prev => {
      const temp = [...prev];
      const target = temp[index];
      temp[index] = temp[index + direction];
      temp[index + direction] = target;
      return temp;
    });
  };

  const generatePdf = () => {
    if (images.length === 0) return;

    const doc = new jsPDF({
      orientation: orientation === 'p' ? 'portrait' : 'landscape',
      unit: 'mm',
      format: pageSize
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    images.forEach((img, index) => {
      if (index > 0) doc.addPage();

      let w = contentWidth;
      let h = contentHeight;
      const ratio = img.width / img.height;

      if (fitMode === 'fit') {
         if (w / h > ratio) {
            w = h * ratio;
         } else {
            h = w / ratio;
         }
      } 
      // 'stretch' uses full w and h
      // 'cover' logic omitted for simplicity in PDF context (usually means crop, which is hard in jsPDF without canvas intermediate)
      
      // Center image
      const x = margin + (contentWidth - w) / 2;
      const y = margin + (contentHeight - h) / 2;

      doc.addImage(img.preview, 'JPEG', x, y, w, h);
    });

    doc.save('images.pdf');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
       {/* Image List */}
       <div className="lg:col-span-2 flex flex-col h-full">
          <div 
             className="flex-1 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl overflow-y-auto custom-scrollbar p-6 relative group transition-colors hover:border-indigo-500/30"
             onClick={() => images.length === 0 && fileInputRef.current?.click()}
          >
             {images.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                   <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                      <ImageIcon className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-200">Add Images</h3>
                   <p className="text-slate-500 mt-2">Click to select files</p>
                </div>
             ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                   {images.map((img, i) => (
                      <div key={img.id} className="relative group/card bg-slate-950 border border-white/5 rounded-xl overflow-hidden aspect-[3/4]">
                         <img src={img.preview} className="w-full h-full object-cover opacity-70 group-hover/card:opacity-100 transition-opacity" alt="" />
                         
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600"><Trash2 className="w-3 h-3"/></button>
                         </div>
                         <div className="absolute bottom-2 left-0 w-full flex justify-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); moveImage(i, -1); }} disabled={i === 0} className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-30"><ArrowUp className="w-3 h-3"/></button>
                            <button onClick={(e) => { e.stopPropagation(); moveImage(i, 1); }} disabled={i === images.length - 1} className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-30"><ArrowDown className="w-3 h-3"/></button>
                         </div>
                         
                         <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                            {i + 1}
                         </div>
                      </div>
                   ))}
                   
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl hover:bg-slate-800/50 transition-colors aspect-[3/4]"
                   >
                      <span className="text-3xl text-slate-500 mb-2">+</span>
                      <span className="text-xs text-slate-400">Add More</span>
                   </button>
                </div>
             )}
             <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFiles} />
          </div>
       </div>

       {/* Settings */}
       <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
          <Card title="PDF Settings">
             <div className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Format</label>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setPageSize('a4')} className={`py-2 rounded-lg text-sm border ${pageSize === 'a4' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>A4</button>
                      <button onClick={() => setPageSize('letter')} className={`py-2 rounded-lg text-sm border ${pageSize === 'letter' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>Letter</button>
                   </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Orientation</label>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setOrientation('p')} className={`py-2 rounded-lg text-sm border ${orientation === 'p' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>Portrait</button>
                      <button onClick={() => setOrientation('l')} className={`py-2 rounded-lg text-sm border ${orientation === 'l' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>Landscape</button>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margin (mm)</label>
                      <span className="text-xs font-mono text-indigo-400">{margin}mm</span>
                   </div>
                   <input type="range" min="0" max="50" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Image Fit</label>
                   <select value={fitMode} onChange={(e:any) => setFitMode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">
                      <option value="fit">Fit Page (Aspect Ratio)</option>
                      <option value="stretch">Stretch to Fill</option>
                   </select>
                </div>
             </div>
          </Card>

          <Button 
             variant="primary" 
             size="lg" 
             className="w-full py-4 text-base shadow-xl shadow-indigo-500/20"
             onClick={generatePdf}
             disabled={images.length === 0}
          >
             <Download className="w-5 h-5" /> Export PDF
          </Button>
       </div>
    </div>
  );
};