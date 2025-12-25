import React, { useState, useRef } from 'react';
import { 
  FileStack, 
  Scissors, 
  RotateCw, 
  Stamp, 
  Image as ImageIcon, 
  ArrowLeft, 
  Upload, 
  Download, 
  Trash2,
  FileText,
  Plus,
  Move
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import { PDFDocument, rgb, degrees } from 'pdf-lib';

type ToolMode = 'home' | 'merge' | 'split' | 'rotate' | 'watermark' | 'img2pdf';

interface PdfFile {
  id: string;
  file: File;
  name: string;
}

export const PdfTools: React.FC = () => {
  const [mode, setMode] = useState<ToolMode>('home');

  const tools = [
    { id: 'merge', name: 'Merge PDF', desc: 'Combine multiple PDFs into one unified document.', icon: FileStack, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'split', name: 'Split PDF', desc: 'Extract pages from your PDF files with ease.', icon: Scissors, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'rotate', name: 'Rotate PDF', desc: 'Rotate your PDF pages 90, 180 or 270 degrees.', icon: RotateCw, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'watermark', name: 'Watermark', desc: 'Stamp text over your PDF pages for protection.', icon: Stamp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'img2pdf', name: 'Image to PDF', desc: 'Convert JPG, PNG, BMP images to PDF format.', icon: ImageIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  if (mode === 'home') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar pr-2 pb-4">
        {tools.map(tool => (
          <button 
            key={tool.id}
            onClick={() => setMode(tool.id as ToolMode)}
            className="group text-left p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            <div className={`w-14 h-14 rounded-2xl ${tool.bg} ${tool.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
              <tool.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">{tool.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{tool.desc}</p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button 
          onClick={() => setMode('home')}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          {tools.find(t => t.id === mode)?.name}
        </h2>
      </div>

      <div className="flex-1 min-h-0 bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
        {mode === 'merge' && <MergeTool />}
        {mode === 'split' && <SplitTool />}
        {mode === 'rotate' && <RotateTool />}
        {mode === 'watermark' && <WatermarkTool />}
        {mode === 'img2pdf' && <ImageToPdfTool />}
      </div>
    </div>
  );
};

// --- Sub Tools ---

const MergeTool: React.FC = () => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const merge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const pdfFile of files) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      downloadPdf(pdfBytes, 'merged.pdf');
    } catch (e) {
      alert("Error merging PDFs. Ensure files are not password protected.");
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6">
        {files.length === 0 ? (
           <EmptyState 
             label="Drop PDFs here to merge" 
             onClick={() => fileInputRef.current?.click()} 
           />
        ) : (
           <div className="space-y-2">
             {files.map((f, i) => (
               <div key={f.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5 animate-in slide-in-from-bottom-2 fade-in">
                 <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">
                     {i + 1}
                   </div>
                   <span className="text-slate-200 font-medium truncate max-w-[200px] md:max-w-md">{f.name}</span>
                 </div>
                 <button onClick={() => removeFile(f.id)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-all flex items-center justify-center gap-2"
             >
               <Plus className="w-4 h-4" /> Add Another PDF
             </button>
           </div>
        )}
        <input type="file" accept="application/pdf" multiple ref={fileInputRef} className="hidden" onChange={handleUpload} />
      </div>
      <div className="pt-4 border-t border-white/5">
        <Button onClick={merge} disabled={files.length < 2 || processing} className="w-full py-4 text-base" variant="primary">
          {processing ? 'Merging...' : `Merge ${files.length} PDFs`}
        </Button>
      </div>
    </div>
  );
};

const RotateTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const process = async () => {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      pages.forEach((page: any) => {
        const { angle } = page.getRotation();
        page.setRotation(degrees(angle + rotation));
      });
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, `rotated_${file.name}`);
    } catch(e) {
      alert("Failed to rotate.");
    }
  };

  return (
    <div className="h-full flex flex-col p-6 items-center justify-center max-w-2xl mx-auto w-full">
      {!file ? (
        <EmptyState label="Upload PDF to Rotate" onClick={() => fileInputRef.current?.click()} />
      ) : (
        <div className="w-full space-y-8">
           <div className="p-6 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div className="text-slate-200 font-medium">{file.name}</div>
              </div>
              <button onClick={() => setFile(null)} className="text-slate-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
           </div>

           <div className="grid grid-cols-3 gap-4">
              {[90, 180, 270].map(deg => (
                <button 
                  key={deg}
                  onClick={() => setRotation(deg)}
                  className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                    rotation === deg 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                   <RotateCw className="w-6 h-6" style={{ transform: `rotate(${deg}deg)` }} />
                   <span className="font-bold">{deg}° CW</span>
                </button>
              ))}
           </div>

           <Button onClick={process} className="w-full py-4" variant="primary">Download Rotated PDF</Button>
        </div>
      )}
      <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
    </div>
  );
};

const SplitTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const f = e.target.files?.[0];
     if (!f) return;
     setFile(f);
     try {
       const pdfDoc = await PDFDocument.load(await f.arrayBuffer());
       setPageCount(pdfDoc.getPageCount());
     } catch(e) {
       console.error(e);
     }
  };

  const process = async () => {
    if (!file || !range) return;
    try {
      const srcDoc = await PDFDocument.load(await file.arrayBuffer());
      const newDoc = await PDFDocument.create();
      
      // Parse range "1, 3-5, 8"
      const indices = new Set<number>();
      range.split(',').forEach(part => {
         const [start, end] = part.split('-').map(s => parseInt(s.trim()));
         if (!isNaN(start)) {
            if (!isNaN(end)) {
               for(let i=start; i<=end; i++) indices.add(i-1);
            } else {
               indices.add(start-1);
            }
         }
      });
      
      const idxArray = Array.from(indices).filter(i => i >= 0 && i < pageCount).sort((a,b) => a-b);
      const copied = await newDoc.copyPages(srcDoc, idxArray);
      copied.forEach((p: any) => newDoc.addPage(p));
      
      downloadPdf(await newDoc.save(), `split_${file.name}`);
    } catch(e) {
      alert("Invalid range or file.");
    }
  };

  return (
    <div className="h-full flex flex-col p-6 items-center justify-center max-w-xl mx-auto w-full">
      {!file ? (
         <EmptyState label="Upload PDF to Split" onClick={() => fileInputRef.current?.click()} />
      ) : (
         <div className="w-full space-y-6">
            <div className="text-center space-y-2">
               <h3 className="text-xl font-bold text-white">Select Pages</h3>
               <p className="text-slate-400">Total Pages: <span className="text-emerald-400 font-mono">{pageCount}</span></p>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Ranges</label>
               <input 
                 type="text" 
                 value={range}
                 onChange={e => setRange(e.target.value)}
                 placeholder="e.g. 1-5, 8, 11-13"
                 className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500/50"
               />
               <p className="text-xs text-slate-500">Comma separated. E.g: "1-5, 10" extracts pages 1 to 5 and page 10.</p>
            </div>

            <div className="flex gap-4">
               <Button variant="secondary" onClick={() => setFile(null)} className="flex-1">Cancel</Button>
               <Button variant="primary" onClick={process} className="flex-1">Extract Pages</Button>
            </div>
         </div>
      )}
      <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden" onChange={handleUpload} />
    </div>
  );
};

const WatermarkTool: React.FC = () => {
   const [file, setFile] = useState<File | null>(null);
   const [text, setText] = useState('CONFIDENTIAL');
   const [opacity, setOpacity] = useState(0.3);
   const [size, setSize] = useState(50);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const process = async () => {
      if (!file) return;
      try {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const pages = pdfDoc.getPages();
        pages.forEach((page: any) => {
           const { width, height } = page.getSize();
           page.drawText(text, {
              x: width / 2 - (text.length * size * 0.25), // Rough centering
              y: height / 2,
              size: size,
              color: rgb(0.5, 0.5, 0.5),
              opacity: opacity,
              rotate: degrees(45),
           });
        });
        downloadPdf(await pdfDoc.save(), `watermarked_${file.name}`);
      } catch(e) {
        alert("Failed to apply watermark.");
      }
   };

   return (
    <div className="h-full flex flex-col p-6 items-center justify-center max-w-xl mx-auto w-full">
      {!file ? (
        <EmptyState label="Upload PDF to Watermark" onClick={() => fileInputRef.current?.click()} />
      ) : (
        <div className="w-full space-y-6">
           <div className="space-y-4 bg-slate-800/30 p-6 rounded-2xl border border-white/5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Watermark Text</label>
                <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Size</label>
                    <input type="number" value={size} onChange={e => setSize(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Opacity ({opacity})</label>
                    <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none accent-indigo-500" />
                 </div>
              </div>
           </div>
           <div className="flex gap-4">
               <Button variant="secondary" onClick={() => setFile(null)} className="flex-1">Cancel</Button>
               <Button variant="primary" onClick={process} className="flex-1">Apply Watermark</Button>
           </div>
        </div>
      )}
      <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
    </div>
   );
};

// Reusing Logic from previous ImageToPdf but condensed
const ImageToPdfTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages(prev => [...prev, {
          id: Math.random().toString(36),
          file, preview: url, width: img.naturalWidth, height: img.naturalHeight
        }]);
      };
      img.src = url;
    });
  };

  const generate = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    
    images.forEach((img, i) => {
       if (i > 0) doc.addPage();
       const ratio = img.width / img.height;
       let w = pw - 20;
       let h = (pw - 20) / ratio;
       if (h > ph - 20) { h = ph - 20; w = h * ratio; }
       doc.addImage(img.preview, 'JPEG', (pw - w)/2, (ph - h)/2, w, h);
    });
    doc.save('images.pdf');
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 overflow-y-auto mb-6">
        {images.length === 0 ? (
           <EmptyState label="Drop Images to Convert" onClick={() => fileInputRef.current?.click()} />
        ) : (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map(img => (
                 <div key={img.id} className="relative aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden group border border-white/5">
                    <img src={img.preview} className="w-full h-full object-cover opacity-70 group-hover:opacity-100" alt="" />
                    <button onClick={() => setImages(p => p.filter(x => x.id !== img.id))} className="absolute top-2 right-2 p-1 bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                 </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                 <Plus className="w-8 h-8" />
              </button>
           </div>
        )}
      </div>
      <Button disabled={images.length === 0} onClick={generate} variant="primary" className="w-full py-4">Convert to PDF</Button>
      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFiles} />
    </div>
  );
};

// --- Shared Components ---

const EmptyState = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="h-full w-full border-2 border-dashed border-slate-700/50 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/30 hover:border-indigo-500/30 transition-all group"
  >
     <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform group-hover:bg-indigo-600">
        <Upload className="w-8 h-8 text-slate-400 group-hover:text-white" />
     </div>
     <h3 className="text-xl font-bold text-slate-300 group-hover:text-white transition-colors">{label}</h3>
     <p className="text-slate-500 mt-2">Click or drag & drop files</p>
  </div>
);

const downloadPdf = (bytes: Uint8Array, name: string) => {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};