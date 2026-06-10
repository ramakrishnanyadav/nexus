import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TwinData, Roadmap } from '@/lib/types';
import { calculateFootprint } from '@/lib/carbonEngine';

export function CarbonTimeMachineView({ twinData, roadmap, onContinue }: { twinData: TwinData, roadmap: Roadmap | null, onContinue: () => void }) {
  const [year, setYear] = useState(2026);
  const progress = (year - 2026) / 4; 
  
  // Dynamic recalculation binding
  const currentTotal = calculateFootprint(twinData).total;
  
  // Extract reduction correctly from the new Zod Schema
  const reduction = roadmap ? (roadmap.phases.reduce((acc, p) => acc + p.subtotal_kg, 0) / 1000) : 1.4;
  const emissions = (currentTotal - (progress * reduction)).toFixed(1);
  
  const savings = roadmap ? Math.round(progress * roadmap.total_saving_inr).toLocaleString('en-IN') : Math.round(progress * 184000).toLocaleString('en-IN');
  const trees = roadmap ? Math.round(progress * roadmap.trees_equivalent) : Math.round(progress * 168);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="w-full max-w-5xl">
      <div className="text-center mb-16">
        <h2 className="text-[48px] md:text-[64px] font-bold mb-4">Carbon Time Machine™</h2>
        <p className="text-2xl text-white/50">Drag the slider to see your future.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="flex flex-col justify-center">
          <div className="surface-card p-8 rounded-3xl mb-6">
            <p className="text-white/50 mb-2 font-medium">Annual Emissions</p>
            <h3 className="text-[64px] font-bold leading-none tabular-data text-white">{emissions} <span className="text-2xl text-white/40">tons</span></h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="surface-elevated p-6 rounded-3xl">
              <p className="text-white/50 mb-2 text-sm font-medium">Money Saved</p>
              <h4 className="text-3xl font-bold tabular-data text-[#10B981]">₹{savings}</h4>
            </div>
            <div className="surface-elevated p-6 rounded-3xl">
              <p className="text-white/50 mb-2 text-sm font-medium">Trees Planted</p>
              <h4 className="text-3xl font-bold tabular-data text-[#22D3EE]">{trees}</h4>
            </div>
          </div>
        </div>

        <div className="relative h-[400px] rounded-3xl overflow-hidden bg-[#111827] border border-white/10 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] to-transparent z-10" />
          <motion.div 
            animate={{ scale: 1 + progress * 0.2, filter: `hue-rotate(${progress * 90}deg)` }}
            className="w-full h-full bg-[url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-40 transition-all duration-300"
          />
          <div className="relative z-20 text-center">
            <h3 className="text-[48px] font-bold tracking-tight mb-2">{year}</h3>
            <p className="text-xl text-white/60">Your trajectory</p>
          </div>
        </div>
      </div>

      <div className="surface-card p-8 rounded-3xl w-full mb-12">
        <div className="flex justify-between mb-6 text-xl font-bold text-white/60">
          <span>2026</span>
          <span className="text-[#10B981]">2030 Destination</span>
        </div>
        <input 
          type="range" min="2026" max="2030" step="1" value={year} 
          onChange={(e) => setYear(parseInt(e.target.value))} 
          className="w-full h-4 bg-[#1F2937] rounded-full appearance-none cursor-pointer accent-[#10B981]" 
          aria-label="Time Machine Year Slider" aria-valuemin={2026} aria-valuemax={2030} aria-valuenow={year}
        />
      </div>

      <div className="text-center">
        <button onClick={onContinue} aria-label="View Enterprise Pitch Slide" className="text-white/40 hover:text-white transition-colors font-medium">
          View Enterprise Pitch Slide
        </button>
      </div>
    </motion.div>
  );
}
