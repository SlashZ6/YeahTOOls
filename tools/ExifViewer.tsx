import React, { useState, useCallback } from 'react';
import { Upload, Camera, MapPin, Info, FileImage, Aperture, Clock, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';

// @ts-ignore
import ExifReader from 'exifreader';

interface ExifData {
  [key: string]: {
    description: any;
    value: any;
  };
}

export const ExifViewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    
    try {
      // Load tags
      const tags = await ExifReader.load(selectedFile);
      setExifData(tags);
    } catch (error) {
      console.error(error);
      alert("Could not parse EXIF data from this file.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  if (!file) {
    return (
       <div className="h-[calc(100vh-12rem)] flex flex-col">
        <div 
          className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer group ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={onDrop}
        >
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            id="exif-upload"
          />
          <label htmlFor="exif-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
               <Info className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-200">Inspect Metadata</h3>
            <p className="text-slate-500 mt-2">Drag & drop or click to upload</p>
            <div className="mt-8 flex gap-3">
               <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400">JPG</span>
               <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400">PNG</span>
               <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400">TIFF</span>
               <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400">HEIC</span>
            </div>
          </label>
        </div>
      </div>
    );
  }

  const getKey = (keys: string[]) => {
    if (!exifData) return null;
    for (const k of keys) {
      if (exifData[k]) return exifData[k].description;
    }
    return null;
  };

  const basicInfo = [
    { label: 'Camera Model', value: getKey(['Model']), icon: Camera },
    { label: 'Manufacturer', value: getKey(['Make']), icon: Camera },
    { label: 'Lens', value: getKey(['LensModel', 'Lens']), icon: Aperture },
    { label: 'Date Taken', value: getKey(['DateTimeOriginal', 'DateTime']), icon: Calendar },
    { label: 'Dimensions', value: exifData?.['Image Width'] ? `${exifData['Image Width'].value} x ${exifData['Image Height']?.value}` : null, icon: FileImage },
  ];

  const exposureInfo = [
    { label: 'Aperture', value: getKey(['FNumber']) },
    { label: 'Shutter Speed', value: getKey(['ExposureTime']) },
    { label: 'ISO', value: getKey(['ISOSpeedRatings', 'ISO']) },
    { label: 'Focal Length', value: getKey(['FocalLength']) },
    { label: 'Flash', value: getKey(['Flash']) },
    { label: 'Exposure Prog.', value: getKey(['ExposureProgram']) },
  ];

  const gpsInfo = {
    lat: exifData?.['GPSLatitude']?.description,
    lon: exifData?.['GPSLongitude']?.description,
    alt: exifData?.['GPSAltitude']?.description
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Preview Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 shadow-lg">
           <img src={preview!} alt="Preview" className="w-full h-auto object-contain max-h-[400px]" />
        </div>
        <Card>
          <div className="text-sm font-medium text-slate-400 mb-4">File Details</div>
          <div className="space-y-3">
             <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-200 truncate max-w-[150px]">{file.name}</span>
             </div>
             <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500">Size</span>
                <span className="text-slate-200">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
             </div>
             <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500">Type</span>
                <span className="text-slate-200">{file.type}</span>
             </div>
          </div>
          <button 
             onClick={() => { setFile(null); setExifData(null); }}
             className="w-full mt-6 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
          >
             Analyze Another Image
          </button>
        </Card>
      </div>

      {/* Data Column */}
      <div className="lg:col-span-2 overflow-y-auto custom-scrollbar pr-2 space-y-6">
         {/* Main Stats */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicInfo.map((item, i) => item.value && (
               <div key={i} className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                     <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                     <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{item.label}</div>
                     <div className="text-slate-200 font-medium">{item.value}</div>
                  </div>
               </div>
            ))}
         </div>

         {/* Exposure Settings */}
         <Card title="Shot Settings">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {exposureInfo.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950/30 border border-white/5">
                     <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</div>
                     <div className="text-slate-200 font-mono text-sm">{item.value || 'N/A'}</div>
                  </div>
               ))}
            </div>
         </Card>

         {/* GPS */}
         {(gpsInfo.lat || gpsInfo.lon) && (
            <Card title="Location Data">
               <div className="flex items-center gap-4 bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-200">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <div className="font-mono text-sm">
                     {gpsInfo.lat} {gpsInfo.lon}
                  </div>
                  {gpsInfo.alt && <div className="text-xs text-emerald-500/70">Elev: {gpsInfo.alt}</div>}
               </div>
            </Card>
         )}

         {/* Raw Data Table */}
         <Card title="All Tags">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="text-xs text-slate-500 border-b border-white/10">
                   <th className="py-2 font-bold uppercase tracking-wider">Tag</th>
                   <th className="py-2 font-bold uppercase tracking-wider">Value</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5 font-mono text-xs text-slate-300">
                 {exifData && Object.entries(exifData).filter(([k]) => k !== 'MakerNote').map(([key, data]) => (
                   <tr key={key} className="hover:bg-white/5">
                     <td className="py-2 pr-4 text-indigo-300">{key}</td>
                     <td className="py-2 break-all">{(data as any).description?.toString().slice(0, 100)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </Card>
      </div>
    </div>
  );
};