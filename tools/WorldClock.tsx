import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Globe, MapPin, Clock, Search, Calendar, Sun, Moon } from 'lucide-react';

const COMMON_ZONES = [
  'UTC', 'GMT', 
  'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Kolkata',
  'Australia/Sydney', 'Pacific/Auckland'
];

export const WorldClock: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [sourceDate, setSourceDate] = useState('');
  const [sourceTime, setSourceTime] = useState('');
  const [targetZone, setTargetZone] = useState('UTC');
  const [convertedTime, setConvertedTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const d = new Date();
    setSourceTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setSourceDate(d.toISOString().split('T')[0]);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sourceDate || !sourceTime) return;
    try {
        const isoString = `${sourceDate}T${sourceTime}:00`;
        const d = new Date(isoString);
        
        const options: Intl.DateTimeFormatOptions = {
          timeZone: targetZone,
          dateStyle: 'full',
          timeStyle: 'medium',
          hour12: true
        };
        setConvertedTime(new Intl.DateTimeFormat('en-US', options).format(d));
    } catch (e) {
        setConvertedTime("Invalid Date/Time");
    }
  }, [sourceDate, sourceTime, targetZone]);

  const liveZones = [
    { label: 'New York', zone: 'America/New_York', sub: 'USA' },
    { label: 'London', zone: 'Europe/London', sub: 'UK' },
    { label: 'Tokyo', zone: 'Asia/Tokyo', sub: 'Japan' },
    { label: 'Sydney', zone: 'Australia/Sydney', sub: 'Australia' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Live Clocks Grid */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 uppercase tracking-widest text-xs mb-4">
           <Globe className="w-4 h-4 text-indigo-400" /> Global Dashboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Local Card */}
           <div className="col-span-full bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative z-10 flex justify-between items-end">
                  <div>
                      <div className="flex items-center gap-2 text-indigo-200 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium tracking-wide">LOCAL TIME</span>
                      </div>
                      <div className="text-6xl font-bold text-white tracking-tighter tabular-nums">
                          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-indigo-200 font-medium mt-2">
                          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric'})}
                      </div>
                  </div>
                  <div className="hidden sm:block">
                      <Clock className="w-16 h-16 text-indigo-300/30" />
                  </div>
              </div>
           </div>
           
           {liveZones.map(z => {
              const date = now.toLocaleDateString('en-US', { timeZone: z.zone, weekday: 'short', month: 'short', day: 'numeric'});
              const time = now.toLocaleTimeString('en-US', { timeZone: z.zone, hour: '2-digit', minute: '2-digit' });
              const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: z.zone, hour: 'numeric', hour12: false }));
              const isDay = hour >= 6 && hour < 18;

              return (
                <div key={z.zone} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-slate-800/60 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-slate-100 font-bold text-lg">{z.label}</div>
                            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">{z.sub}</div>
                        </div>
                        {isDay ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-300" />}
                    </div>
                    <div className="text-3xl font-mono text-slate-200 font-light mb-1">{time}</div>
                    <div className="text-xs text-slate-500 border-t border-white/5 pt-2 mt-2">{date}</div>
                </div>
              );
           })}
        </div>
      </div>

      {/* Converter Panel */}
      <div className="space-y-6">
         <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 uppercase tracking-widest text-xs mb-4">
           <Calendar className="w-4 h-4 text-emerald-400" /> Time Travel
        </h2>
        
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl h-full flex flex-col justify-center">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                     <input 
                       type="date" 
                       value={sourceDate}
                       onChange={(e) => setSourceDate(e.target.value)}
                       className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time</label>
                     <input 
                       type="time" 
                       value={sourceTime}
                       onChange={(e) => setSourceTime(e.target.value)}
                       className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                     />
                  </div>
               </div>

               <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-slate-700 to-transparent" />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Location</label>
                  <div className="relative">
                    <select 
                       value={targetZone}
                       onChange={(e) => setTargetZone(e.target.value)}
                       className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-4 text-slate-200 text-base focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
                    >
                       {COMMON_ZONES.map(z => (
                           <option key={z} value={z}>{z.replace('_', ' ')}</option>
                       ))}
                    </select>
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
               </div>

               <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-center">
                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-2">Projected Time</div>
                  <div className="text-xl md:text-2xl font-bold text-emerald-100">{convertedTime}</div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};