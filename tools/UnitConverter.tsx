import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Scale, Ruler, Thermometer, Box, Copy, ArrowRightLeft, Spline } from 'lucide-react';
import { Button } from '../components/ui/Button';

type Category = 'length' | 'weight' | 'temp' | 'volume' | 'area';

const CATEGORIES: { id: Category; label: string; icon: React.FC<any> }[] = [
  { id: 'length', label: 'Length', icon: Ruler },
  { id: 'weight', label: 'Weight', icon: Scale },
  { id: 'temp', label: 'Temperature', icon: Thermometer },
  { id: 'volume', label: 'Volume', icon: Box },
  { id: 'area', label: 'Area', icon: Spline },
];

const UNITS: Record<Category, { id: string; label: string; factor: number; offset?: number }[]> = {
  length: [
    { id: 'm', label: 'Meters (m)', factor: 1 },
    { id: 'km', label: 'Kilometers (km)', factor: 1000 },
    { id: 'cm', label: 'Centimeters (cm)', factor: 0.01 },
    { id: 'mm', label: 'Millimeters (mm)', factor: 0.001 },
    { id: 'ft', label: 'Feet (ft)', factor: 0.3048 },
    { id: 'in', label: 'Inches (in)', factor: 0.0254 },
    { id: 'yd', label: 'Yards (yd)', factor: 0.9144 },
    { id: 'mi', label: 'Miles (mi)', factor: 1609.344 },
  ],
  weight: [
    { id: 'kg', label: 'Kilograms (kg)', factor: 1 },
    { id: 'g', label: 'Grams (g)', factor: 0.001 },
    { id: 'mg', label: 'Milligrams (mg)', factor: 0.000001 },
    { id: 'lb', label: 'Pounds (lb)', factor: 0.45359237 },
    { id: 'oz', label: 'Ounces (oz)', factor: 0.02834952 },
  ],
  temp: [
    { id: 'c', label: 'Celsius (°C)', factor: 1, offset: 0 },
    { id: 'f', label: 'Fahrenheit (°F)', factor: 1, offset: 0 },
    { id: 'k', label: 'Kelvin (K)', factor: 1, offset: 0 },
  ],
  volume: [
    { id: 'l', label: 'Liters (L)', factor: 1 },
    { id: 'ml', label: 'Milliliters (ml)', factor: 0.001 },
    { id: 'gal', label: 'Gallons (US)', factor: 3.78541 },
    { id: 'qt', label: 'Quarts (US)', factor: 0.946353 },
    { id: 'pt', label: 'Pints (US)', factor: 0.473176 },
    { id: 'cup', label: 'Cups (US)', factor: 0.236588 },
  ],
  area: [
    { id: 'sqm', label: 'Square Meters (m²)', factor: 1 },
    { id: 'sqkm', label: 'Square Kilometers (km²)', factor: 1000000 },
    { id: 'sqft', label: 'Square Feet (ft²)', factor: 0.092903 },
    { id: 'acre', label: 'Acres', factor: 4046.86 },
    { id: 'ha', label: 'Hectares', factor: 10000 },
  ]
};

export const UnitConverter: React.FC = () => {
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState(UNITS['length'][0].id);
  const [toUnit, setToUnit] = useState(UNITS['length'][4].id);
  const [inputValue, setInputValue] = useState<number>(1);
  const [outputValue, setOutputValue] = useState<number>(0);

  useEffect(() => {
    const validUnits = UNITS[category];
    if (!validUnits.find(u => u.id === fromUnit)) setFromUnit(validUnits[0].id);
    if (!validUnits.find(u => u.id === toUnit)) setToUnit(validUnits[1]?.id || validUnits[0].id);
  }, [category]);

  useEffect(() => {
    if (category === 'temp') {
      convertTemp();
    } else {
      const from = UNITS[category].find(u => u.id === fromUnit);
      const to = UNITS[category].find(u => u.id === toUnit);
      if (from && to) {
        const base = inputValue * from.factor;
        setOutputValue(base / to.factor);
      }
    }
  }, [inputValue, fromUnit, toUnit, category]);

  const convertTemp = () => {
    let val = inputValue;
    if (fromUnit === 'f') val = (val - 32) * (5/9);
    else if (fromUnit === 'k') val = val - 273.15;
    
    if (toUnit === 'f') val = (val * 9/5) + 32;
    else if (toUnit === 'k') val = val + 273.15;
    
    setOutputValue(val);
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(outputValue.toString());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Category Navigation */}
      <div className="flex flex-wrap justify-center gap-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
              category === cat.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                : 'bg-slate-900/40 border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/10'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="relative">
          {/* Main Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
             
             <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                
                {/* From Input */}
                <div className="flex-1 w-full space-y-4">
                   <div className="relative group">
                      <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-6 text-4xl font-light text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                        placeholder="0"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600 uppercase tracking-widest pointer-events-none">Input</span>
                   </div>
                   <select
                      value={fromUnit}
                      onChange={(e) => setFromUnit(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none hover:bg-slate-800 transition-colors cursor-pointer text-center font-medium"
                   >
                      {UNITS[category].map(u => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                      ))}
                   </select>
                </div>

                {/* Swap Button */}
                <button 
                  onClick={swap}
                  className="p-4 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-500 hover:scale-110 hover:rotate-180 transition-all duration-500 shadow-xl border border-slate-700 z-10"
                >
                  <ArrowRightLeft className="w-6 h-6" />
                </button>

                {/* To Output */}
                <div className="flex-1 w-full space-y-4">
                   <div className="relative group">
                      <input
                        type="text"
                        readOnly
                        value={Number.isInteger(outputValue) ? outputValue : outputValue.toFixed(4)}
                        className="w-full bg-indigo-900/10 border border-indigo-500/20 rounded-2xl px-6 py-6 text-4xl font-light text-indigo-300 focus:outline-none cursor-default"
                        placeholder="0"
                      />
                       <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-500/50 uppercase tracking-widest pointer-events-none">Result</span>
                       <button 
                         onClick={copyResult}
                         className="absolute right-2 bottom-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-indigo-500/20 rounded-lg"
                         title="Copy Result"
                       >
                          <Copy className="w-5 h-5" />
                       </button>
                   </div>
                   <select
                      value={toUnit}
                      onChange={(e) => setToUnit(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none hover:bg-slate-800 transition-colors cursor-pointer text-center font-medium"
                   >
                      {UNITS[category].map(u => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                      ))}
                   </select>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};