import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, ArrowRight, Download, FileImage, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type SupportedFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp';

const FORMATS: { mime: SupportedFormat; label: string; ext: string }[] = [
  { mime: 'image/png', label: 'PNG', ext: 'png' },
  { mime: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { mime: 'image/webp', label: 'WEBP', ext: 'webp' },
  { mime: 'image/bmp', label: 'BMP', ext: 'bmp' },
];

export const ImageConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingFormat, setProcessingFormat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    const img = new Image();
    img.onload = () => {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleConvert = (targetFormat: SupportedFormat, extension: string) => {
    if (!file || !previewUrl || !imageMeta) return;

    setProcessingFormat(targetFormat);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = previewUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imageMeta.width;
      canvas.height = imageMeta.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setProcessingFormat(null);
        return;
      }

      if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      try {
        const dataUrl = canvas.toDataURL(targetFormat, 0.9);
        const link = document.createElement('a');
        link.download = `${file.name.substring(0, file.name.lastIndexOf('.'))}_converted.${extension}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        alert("Conversion failed. The image might be too large.");
      } finally {
        setProcessingFormat(null);
      }
    };
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
  };

  if (!file) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        <div 
          className={`flex-1 relative rounded-3xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden group
            ${isDragging 
              ? 'bg-indigo-500/10 border-2 border-indigo-500' 
              : 'bg-slate-900/40 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-900/60'
            }
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.5) 1px, transparent 0)', backgroundSize: '40px 40px' }} 
          />
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 ${isDragging ? 'bg-indigo-500 scale-110 rotate-12' : 'bg-slate-800 group-hover:bg-indigo-600 group-hover:scale-110'}`}>
             <Upload className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-indigo-400 group-hover:text-white'}`} />
          </div>
          
          <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Drop Image Here</h3>
          <p className="text-slate-400 text-lg mb-8">or click to browse files</p>
          
          <div className="flex gap-3">
             {['PNG', 'JPG', 'WEBP', 'BMP'].map(fmt => (
                 <span key={fmt} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">{fmt}</span>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full lg:h-[calc(100vh-12rem)]">
      {/* Preview Section */}
      <div className="lg:col-span-2 h-full flex flex-col">
        <div className="flex-1 rounded-3xl overflow-hidden relative flex items-center justify-center bg-slate-950/30 border border-white/10 shadow-2xl">
           <div className="absolute inset-0 z-0 opacity-10" 
                style={{ backgroundImage: 'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
           </div>
           
           <img 
             src={previewUrl!} 
             alt="Preview" 
             className="relative z-10 max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg"
           />

           <button 
             onClick={reset}
             className="absolute top-6 right-6 z-20 p-3 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/50 border border-white/10 backdrop-blur-md transition-all group"
           >
             <X className="w-5 h-5 group-hover:scale-110" />
           </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col gap-6">
        <Card title="Image Details" className="shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center shrink-0">
               <FileImage className="w-7 h-7 text-indigo-400" />
             </div>
             <div className="min-w-0">
               <div className="text-white font-bold truncate text-lg" title={file.name}>{file.name}</div>
               <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <span className="font-mono bg-white/5 px-1.5 rounded">{formatFileSize(file.size)}</span>
                  <span>•</span>
                  {imageMeta && <span className="font-mono">{imageMeta.width} x {imageMeta.height}</span>}
               </div>
             </div>
          </div>
        </Card>

        <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-xl">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <RefreshCw className="w-5 h-5 text-emerald-400" />
             Target Format
           </h3>
           
           <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {FORMATS.filter(f => f.mime !== file.type).map((format) => (
                <button
                  key={format.mime}
                  disabled={processingFormat !== null}
                  onClick={() => handleConvert(format.mime, format.ext)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/40 hover:bg-indigo-600 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                     <span className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-white group-hover:bg-white/20 transition-colors">
                        {format.ext.toUpperCase()}
                     </span>
                     <span className="text-slate-300 font-medium group-hover:text-white">{format.label}</span>
                  </div>
                  {processingFormat === format.mime ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  )}
                </button>
              ))}
           </div>

           {file.type === 'image/jpeg' && (
             <div className="mt-6 flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                <p>Note: Converting from JPEG will not restore original transparency as JPEGs are flattened.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};