import React, { useState, useRef, useEffect } from 'react';
import { Upload, Film, Video, Music, Download, X, AlertCircle, FileVideo, Play, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Declare global GIF object from the script tag in index.html
declare const GIF: any;

// Utility to write WAV file from AudioBuffer
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

  // write WAVE header
  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit 

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  for(i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); 
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
      view.setInt16(pos, sample, true); 
      pos += 2;
    }
    offset++; 
  }

  return new Blob([bufferArr], {type: "audio/wav"});
};

export const VideoConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingState, setProcessingState] = useState<{
    type: 'converting' | 'extracting' | 'gif' | null;
    progress: number; // 0-100
    message: string;
  }>({ type: null, progress: 0, message: '' });
  
  const [duration, setDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check supported formats
  const supportsWebM = MediaRecorder.isTypeSupported('video/webm');
  const supportsMP4 = MediaRecorder.isTypeSupported('video/mp4');

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setDuration(v.duration);
    setVideoDimensions({ width: v.videoWidth, height: v.videoHeight });
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const extractAudio = async () => {
    if (!file) return;
    setProcessingState({ type: 'extracting', progress: 10, message: 'Decoding audio data...' });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
      
      setProcessingState({ type: 'extracting', progress: 50, message: 'Encoding to WAV...' });
      const wavBlob = audioBufferToWav(decodedData);
      
      setProcessingState({ type: 'extracting', progress: 100, message: 'Done!' });
      downloadBlob(wavBlob, `${file.name.split('.')[0]}.wav`);
    } catch (e) {
      console.error(e);
      alert('Failed to extract audio. The format might not be supported for decoding.');
    } finally {
      setTimeout(() => setProcessingState({ type: null, progress: 0, message: '' }), 1000);
    }
  };

  const convertVideo = (mimeType: string, ext: string) => {
    if (!videoRef.current || !file) return;
    const video = videoRef.current;
    
    setProcessingState({ type: 'converting', progress: 0, message: 'Initializing recording...' });

    video.playbackRate = 2.0; 
    video.currentTime = 0;
    
    // Fix: cast video to any because captureStream is not in default HTMLVideoElement definition
    const stream = (video as any).captureStream();
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      downloadBlob(blob, `${file.name.split('.')[0]}.${ext}`);
      setProcessingState({ type: null, progress: 0, message: '' });
      video.playbackRate = 1.0;
      video.currentTime = 0;
      video.pause();
    };

    recorder.start();
    video.play();

    const checkProgress = setInterval(() => {
        if (video.paused || video.ended) {
            clearInterval(checkProgress);
            if (recorder.state === 'recording') recorder.stop();
        }
        const percent = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
        setProcessingState({ 
            type: 'converting', 
            progress: percent, 
            message: `Recording... ${percent}%` 
        });
    }, 100);
  };

  const createGif = async () => {
    if (!videoRef.current || !file) return;
    const video = videoRef.current;
    
    if (typeof GIF === 'undefined') {
      alert("GIF library failed to load. Please refresh the page.");
      return;
    }

    setProcessingState({ type: 'gif', progress: 1, message: 'Loading workers...' });

    // 1. Fetch the worker code manually to avoid CORS issues with the library's default loader
    let workerUrl = '';
    try {
      const workerBlob = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(r => r.blob());
      workerUrl = URL.createObjectURL(workerBlob);
    } catch (e) {
      alert("Could not load GIF worker. Check internet connection.");
      setProcessingState({ type: null, progress: 0, message: '' });
      return;
    }
    
    // Config
    const fps = 10;
    const scale = 0.5; // Downscale for performance
    const width = Math.floor(video.videoWidth * scale);
    const height = Math.floor(video.videoHeight * scale);
    const interval = 1 / fps;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return;

    // Initialize gif.js
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: width,
      height: height,
      workerScript: workerUrl
    });

    gif.on('finished', (blob: Blob) => {
      setProcessingState({ type: 'gif', progress: 100, message: 'Downloading...' });
      downloadBlob(blob, `${file.name.split('.')[0]}.gif`);
      setProcessingState({ type: null, progress: 0, message: '' });
      URL.revokeObjectURL(workerUrl);
    });

    gif.on('progress', (p: number) => {
       // p is 0 to 1 during the rendering phase
       setProcessingState(prev => ({ 
         ...prev, 
         message: 'Rendering GIF...',
         // We map the rendering phase to the last 20% of the progress bar
         progress: 80 + Math.round(p * 20) 
       }));
    });

    let currentTime = 0;
    video.pause();
    
    const processFrame = async () => {
        if (currentTime >= video.duration) {
            setProcessingState({ type: 'gif', progress: 80, message: 'Compiling GIF...' });
            gif.render();
            return;
        }

        video.currentTime = currentTime;
        
        // Wait for seek
        await new Promise<void>(resolve => {
            const onSeek = () => {
                video.removeEventListener('seeked', onSeek);
                resolve();
            };
            video.addEventListener('seeked', onSeek);
        });

        // Draw to canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Add frame to gif.js
        gif.addFrame(ctx, { copy: true, delay: interval * 1000 });
        
        currentTime += interval;
        
        // Map capturing phase to first 80% of progress
        const percent = Math.min(80, Math.round((currentTime / video.duration) * 80));
        setProcessingState({ type: 'gif', progress: percent, message: `Capturing frames... ${percent}%` });
        
        // Schedule next frame
        setTimeout(processFrame, 0);
    };

    processFrame();
  };

  const reset = () => {
    setFile(null);
    setVideoUrl(null);
    setProcessingState({ type: null, progress: 0, message: '' });
  };

  if (!file) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        <div 
          className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 shadow-xl">
             <Video className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-200">Upload Video</h3>
          <p className="text-slate-500 mt-2">Drag & drop or click to browse</p>
          <p className="text-xs text-slate-600 mt-4 uppercase tracking-wider font-medium">Supports MP4, WebM, MKV, MOV</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full lg:h-[calc(100vh-12rem)]">
      {/* Video Preview */}
      <div className="lg:col-span-2 h-full flex flex-col">
        <Card className="flex-1 p-0 overflow-hidden relative flex items-center justify-center bg-slate-950/30 border-slate-800">
           {videoUrl && (
             <video 
               ref={videoRef}
               src={videoUrl}
               className="max-w-full max-h-full"
               controls
               onLoadedMetadata={handleLoadedMetadata}
             />
           )}
           <button 
             onClick={reset}
             className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700 backdrop-blur-sm transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </Card>
      </div>

      {/* Controls */}
      <div className="space-y-6">
        <Card title="Video Info">
          <div className="flex items-start gap-4 mb-4">
             <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
               <FileVideo className="w-5 h-5 text-indigo-400" />
             </div>
             <div className="overflow-hidden">
               <div className="text-slate-200 font-medium truncate" title={file.name}>{file.name}</div>
               <div className="text-xs text-slate-500 mt-1">
                 {Math.round(duration)}s • {videoDimensions.width}x{videoDimensions.height} • {(file.size / (1024*1024)).toFixed(1)} MB
               </div>
             </div>
          </div>
        </Card>

        <Card title="Convert Format">
          <div className="space-y-3">
             <Button 
               variant="secondary" 
               className="w-full justify-between group"
               disabled={!supportsMP4 || processingState.type !== null}
               onClick={() => convertVideo('video/mp4', 'mp4')}
             >
                <span className="flex items-center gap-2">
                   <Film className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                   Convert to MP4
                </span>
                {!supportsMP4 && <span className="text-xs text-red-400">Not Supported</span>}
             </Button>
             
             <Button 
               variant="secondary" 
               className="w-full justify-between group"
               disabled={!supportsWebM || processingState.type !== null}
               onClick={() => convertVideo('video/webm;codecs=vp8', 'webm')}
             >
                <span className="flex items-center gap-2">
                   <Video className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                   Convert to WebM
                </span>
             </Button>

             <Button 
               variant="secondary" 
               className="w-full justify-between group"
               disabled={processingState.type !== null}
               onClick={createGif}
             >
                <span className="flex items-center gap-2">
                   <div className="w-4 h-4 flex items-center justify-center border border-current rounded text-[8px] font-bold">GIF</div>
                   Convert to GIF
                </span>
                <span className="text-xs text-slate-500">Using gif.js</span>
             </Button>
          </div>
        </Card>

        <Card title="Extract Audio">
           <Button 
             variant="secondary"
             className="w-full justify-between group"
             disabled={processingState.type !== null}
             onClick={extractAudio}
           >
              <span className="flex items-center gap-2">
                 <Music className="w-4 h-4 text-slate-500 group-hover:text-pink-400" />
                 Extract as WAV
              </span>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
           </Button>
        </Card>

        {processingState.type && (
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-300">{processingState.message}</span>
                <span className="text-xs font-mono text-indigo-400">{processingState.progress}%</span>
             </div>
             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${processingState.progress}%` }}
                />
             </div>
             {processingState.type === 'converting' && (
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                   <AlertCircle className="w-3 h-3" />
                   Do not switch tabs while recording.
                </p>
             )}
          </div>
        )}
      </div>
    </div>
  );
};