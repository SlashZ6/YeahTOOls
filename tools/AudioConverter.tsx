import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Volume2, Activity, Play, Pause, Download, Gauge, Settings2, FileAudio } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Declaration for external library
declare const lamejs: any;

// --- Helper: WAV Encoding ---
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // length = 16
  setUint16(1);          // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16);         // 16-bit 
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for(i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); 
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
      view.setInt16(pos, sample, true); 
      pos += 2;
    }
    offset++; 
  }
  return new Blob([bufferArr], {type: "audio/wav"});
};

export const AudioConverter: React.FC = () => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState<{status: string, progress: number} | null>(null);
  
  // Settings
  const [format, setFormat] = useState<'wav' | 'mp3' | 'aac' | 'flac'>('mp3');
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [sampleRate, setSampleRate] = useState<number>(0); // 0 = Keep Original

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported formats check
  const supportsAAC = MediaRecorder.isTypeSupported('audio/mp4');
  const supportsFLAC = MediaRecorder.isTypeSupported('audio/flac') || MediaRecorder.isTypeSupported('audio/webm;codecs=flac');

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/') && !selectedFile.type.startsWith('video/')) {
      alert('Please select a valid audio file');
      return;
    }
    
    stopPlayback();
    setFile(selectedFile);
    setProcessing({ status: 'Decoding audio...', progress: 0 });

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferRef.current = decodedBuffer;
      setDuration(decodedBuffer.duration);
      
      drawWaveform(decodedBuffer);
      setProcessing(null);
    } catch (e) {
      console.error(e);
      alert('Failed to load audio file.');
      setProcessing(null);
    }
  };

  const drawWaveform = (buffer: AudioBuffer) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#6366f1'; // Indigo-500
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  };

  const togglePlayback = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      const ctx = audioContextRef.current;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = speed;
      gain.gain.value = volume;

      source.connect(gain);
      gain.connect(ctx.destination);
      
      source.onended = () => setIsPlaying(false);
      source.start(0);
      
      sourceNodeRef.current = source;
      gainNodeRef.current = gain;
      setIsPlaying(true);
    }
  };

  const processAndDownload = async () => {
    if (!audioBufferRef.current) return;
    const originalBuffer = audioBufferRef.current;

    setProcessing({ status: 'Rendering audio...', progress: 10 });

    // 1. Setup Offline Context for processing modifiers (Speed, Volume, Sample Rate)
    const targetSampleRate = sampleRate || originalBuffer.sampleRate;
    const targetDuration = originalBuffer.duration / speed;
    const targetLength = Math.ceil(targetDuration * targetSampleRate);

    const offlineCtx = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      targetLength,
      targetSampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;
    source.playbackRate.value = speed;

    const gain = offlineCtx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(offlineCtx.destination);
    source.start(0);

    // 2. Render processed audio
    const renderedBuffer = await offlineCtx.startRendering();
    setProcessing({ status: 'Encoding...', progress: 50 });

    // 3. Encode based on format
    let blob: Blob | null = null;
    let extension: string = format; // Explicit type assignment to allow 'm4a'

    try {
      if (format === 'wav') {
        blob = audioBufferToWav(renderedBuffer);
      } 
      else if (format === 'mp3') {
        if (typeof lamejs === 'undefined') throw new Error("MP3 Encoder library not loaded");
        blob = await encodeMp3(renderedBuffer);
      }
      else if (format === 'aac' || format === 'flac') {
         blob = await encodeMediaRecorder(renderedBuffer, format);
         extension = format === 'aac' ? 'm4a' : 'flac'; // AAC usually in m4a container
      }

      if (blob) {
        setProcessing({ status: 'Downloading...', progress: 100 });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file!.name.split('.')[0]}_converted.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Conversion Error: ${e.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const encodeMp3 = async (buffer: AudioBuffer): Promise<Blob> => {
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 192); // 192kbps
    const mp3Data = [];

    // Helper to convert Float32 to Int16
    const floatTo16BitPCM = (input: Float32Array) => {
       const output = new Int16Array(input.length);
       for (let i = 0; i < input.length; i++) {
         const s = Math.max(-1, Math.min(1, input[i]));
         output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
       }
       return output;
    };

    const left = floatTo16BitPCM(buffer.getChannelData(0));
    const right = channels > 1 ? floatTo16BitPCM(buffer.getChannelData(1)) : undefined;
    
    const sampleBlockSize = 1152;
    for (let i = 0; i < left.length; i += sampleBlockSize) {
       const leftChunk = left.subarray(i, i + sampleBlockSize);
       const rightChunk = right ? right.subarray(i, i + sampleBlockSize) : undefined;
       
       const mp3buf = (channels === 1) 
         ? mp3encoder.encodeBuffer(leftChunk)
         : mp3encoder.encodeBuffer(leftChunk, rightChunk);
         
       if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
    
    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) mp3Data.push(endBuf);

    return new Blob(mp3Data, { type: 'audio/mp3' });
  };

  const encodeMediaRecorder = (buffer: AudioBuffer, type: 'aac' | 'flac'): Promise<Blob> => {
    return new Promise((resolve, reject) => {
       // We need to play the buffer into a MediaStream to record it
       // NOTE: This is a real-time process, but for short clips it's acceptable.
       // For a truly offline "instant" AAC/FLAC without ffmpeg.wasm, this is the browser constraint.
       // We will speed up the context if possible, but MediaRecorder records time.
       
       // Create a new context specifically for recording
       const recCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
       const dest = recCtx.createMediaStreamDestination();
       const source = recCtx.createBufferSource();
       source.buffer = buffer;
       source.connect(dest);

       const mimeType = type === 'aac' ? 'audio/mp4' : 'audio/webm;codecs=flac'; // Chrome needs wrapper for FLAC? Or just audio/flac for FF
       // Attempt strict mime types
       let finalMime = mimeType;
       if (!MediaRecorder.isTypeSupported(finalMime)) {
           if (type === 'flac' && MediaRecorder.isTypeSupported('audio/flac')) finalMime = 'audio/flac';
           else if (type === 'aac' && MediaRecorder.isTypeSupported('audio/aac')) finalMime = 'audio/aac';
           else {
               reject(new Error(`Browser does not support ${type} encoding natively.`));
               return;
           }
       }

       const recorder = new MediaRecorder(dest.stream, { mimeType: finalMime });
       const chunks: BlobPart[] = [];

       recorder.ondataavailable = (e) => chunks.push(e.data);
       recorder.onstop = () => {
           resolve(new Blob(chunks, { type: finalMime }));
           recCtx.close();
       };

       source.onended = () => {
           recorder.stop();
       };

       recorder.start();
       source.start(0);
    });
  };

  // Drag & Drop
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
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
          <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,video/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 shadow-xl">
             <Music className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-200">Upload Audio</h3>
          <p className="text-slate-500 mt-2">Drag & drop or click to browse</p>
          <p className="text-xs text-slate-600 mt-4 uppercase tracking-wider font-medium">Supports MP3, WAV, AAC, FLAC, OGG</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full lg:h-[calc(100vh-12rem)]">
      {/* Visualizer / Player Section */}
      <div className="lg:col-span-2 h-full flex flex-col">
        <Card className="flex-1 p-0 overflow-hidden relative flex flex-col bg-slate-950/30 border-slate-800">
           {/* Canvas Visualizer */}
           <div className="flex-1 relative w-full flex items-center justify-center bg-slate-900">
             <canvas ref={canvasRef} width={800} height={300} className="w-full h-full object-cover opacity-80" />
             {processing && (
                 <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-20">
                     <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p className="text-indigo-400 font-medium">{processing.status}</p>
                 </div>
             )}
           </div>

           {/* Player Bar */}
           <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center px-6 gap-6">
              <button 
                onClick={togglePlayback}
                className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
              </button>
              
              <div className="flex-1">
                 <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-medium text-slate-200">{file.name}</span>
                    <span>{Math.floor(duration)}s</span>
                 </div>
                 <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-700 w-full animate-pulse"></div>
                 </div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
              </Button>
           </div>
        </Card>
      </div>

      {/* Controls Section */}
      <div className="space-y-6 overflow-y-auto pr-1">
        <Card title="Conversion Settings">
          <div className="space-y-6">
             {/* Format Selection */}
             <div className="space-y-3">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <FileAudio className="w-3 h-3" /> Target Format
               </label>
               <div className="grid grid-cols-2 gap-2">
                  {(['mp3', 'wav', 'aac', 'flac'] as const).map((fmt) => {
                      const disabled = (fmt === 'aac' && !supportsAAC) || (fmt === 'flac' && !supportsFLAC);
                      return (
                        <button
                          key={fmt}
                          onClick={() => setFormat(fmt)}
                          disabled={disabled}
                          className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                            format === fmt 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                              : disabled
                                ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed decoration-slate-600'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      );
                  })}
               </div>
               {format === 'aac' && <p className="text-[10px] text-slate-500">Note: AAC conversion uses real-time recording (slower).</p>}
               {format === 'flac' && <p className="text-[10px] text-slate-500">Note: FLAC conversion uses real-time recording (slower).</p>}
             </div>

             <div className="h-px bg-slate-800/50" />

             {/* Speed Control */}
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Gauge className="w-3 h-3" /> Speed <span className="text-[10px] normal-case opacity-50">(Affects Pitch)</span>
                 </label>
                 <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{speed}x</span>
               </div>
               <input 
                 type="range" min="0.5" max="2.0" step="0.1" 
                 value={speed}
                 onChange={(e) => setSpeed(parseFloat(e.target.value))}
                 className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
               <div className="flex justify-between text-[10px] text-slate-600 font-medium">
                  <span>0.5x</span>
                  <span>Normal</span>
                  <span>2.0x</span>
               </div>
             </div>

             {/* Volume Control */}
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Volume2 className="w-3 h-3" /> Volume
                 </label>
                 <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{Math.round(volume * 100)}%</span>
               </div>
               <input 
                 type="range" min="0" max="2.0" step="0.1" 
                 value={volume}
                 onChange={(e) => setVolume(parseFloat(e.target.value))}
                 className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
             </div>

             {/* Sample Rate */}
             <div className="space-y-3">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Sample Rate (Hz)
               </label>
               <select 
                 value={sampleRate} 
                 onChange={(e) => setSampleRate(Number(e.target.value))}
                 className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
               >
                 <option value={0}>Original (Keep Same)</option>
                 <option value={44100}>44100 Hz (CD)</option>
                 <option value={48000}>48000 Hz (DVD)</option>
                 <option value={32000}>32000 Hz (Radio)</option>
                 <option value={16000}>16000 Hz (VoIP)</option>
               </select>
             </div>
          </div>
        </Card>

        <Button 
          variant="primary" 
          className="w-full py-4 text-base shadow-xl shadow-indigo-500/20"
          onClick={processAndDownload}
          disabled={!!processing}
        >
          {processing ? (
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
             </div>
          ) : (
             <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                <span>Convert & Download</span>
             </div>
          )}
        </Button>
      </div>
    </div>
  );
};