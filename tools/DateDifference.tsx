import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Calendar, Clock, ArrowRight, Hourglass } from 'lucide-react';

export const DateDifference: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalWeeks: number;
  } | null>(null);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalWeeks = (totalDays / 7).toFixed(1);

      // Detailed calc
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      let days = end.getDate() - start.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      
      // Handle inverse selection visually by taking absolute if naive math was negative before correction
      // But standard way is usually to swap start/end for calculation logic or use absolute difference.
      // For this UI, we assume user wants difference, so negative duration isn't typically useful.
      // The logic above works for chronological order. If Start > End, we should swap for display logic.
      if (start > end) {
         // Recursively call with swapped? Or just warn? Let's just calculate absolute difference for Y/M/D manually again properly
         const s = end;
         const e = start;
         years = e.getFullYear() - s.getFullYear();
         months = e.getMonth() - s.getMonth();
         days = e.getDate() - s.getDate();
         if (days < 0) {
            months--;
            const prevMonth = new Date(e.getFullYear(), e.getMonth(), 0);
            days += prevMonth.getDate();
         }
         if (months < 0) {
            years--;
            months += 12;
         }
      }

      setResult({
        years,
        months,
        days,
        totalDays,
        totalWeeks: Number(totalWeeks)
      });
    }
  }, [startDate, endDate]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Start Input */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl space-y-3">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Start Date
             </label>
             <input 
               type="date" 
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-4 text-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
             />
          </div>

          <div className="flex justify-center md:hidden text-slate-500">
             <ArrowRight className="w-6 h-6 rotate-90" />
          </div>

          {/* End Input */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl space-y-3">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> End Date
             </label>
             <input 
               type="date" 
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-4 text-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
             />
          </div>
       </div>

       {/* Result Display */}
       <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center">
             
             <div className="flex items-center justify-center gap-3 mb-8">
                <Hourglass className="w-6 h-6 text-indigo-400" />
                <span className="text-lg font-medium text-slate-300">Duration</span>
             </div>

             <div className="flex flex-wrap items-center justify-center gap-4 md:gap-12">
                 <TimeBlock value={result?.years || 0} label="Years" />
                 <TimeBlock value={result?.months || 0} label="Months" />
                 <TimeBlock value={result?.days || 0} label="Days" />
             </div>

             <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                 <div className="text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Days</div>
                    <div className="text-2xl md:text-3xl font-mono text-slate-200">{result?.totalDays}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Weeks</div>
                    <div className="text-2xl md:text-3xl font-mono text-slate-200">{result?.totalWeeks}</div>
                 </div>
             </div>

          </div>
       </div>
    </div>
  );
};

const TimeBlock = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col items-center">
     <div className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 tracking-tighter">
        {value}
     </div>
     <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest mt-2">{label}</div>
  </div>
);