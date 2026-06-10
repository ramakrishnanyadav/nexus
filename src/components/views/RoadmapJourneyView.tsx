import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { RoadmapResult, RoadmapPhase, RoadmapAction } from '@/lib/types';

export const RoadmapJourneyView = memo(function RoadmapJourneyView({ roadmap, baselineTotal, onContinue }: { roadmap: RoadmapResult | null, baselineTotal: number, onContinue: () => void }) {
  if (!roadmap) return null;
  
  // Calculate destination based on actual roadmap phases
  const totalReduction = useMemo(() => 
    roadmap.phases.reduce((acc: number, p: RoadmapPhase) => acc + p.subtotal_kg, 0) / 1000,
    [roadmap]
  );
  
  const destination = useMemo(() => 
    Math.max(0, baselineTotal - totalReduction).toFixed(1),
    [baselineTotal, totalReduction]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl flex flex-col items-center">
      <h2 className="text-[48px] font-bold mb-16 text-center">Your Journey to Reduction</h2>
      
      <div className="w-full relative py-8">
        <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#10B981] via-[#22D3EE] to-[#1F2937]" />
        
        <div className="relative pl-24 mb-16">
          <div className="absolute left-6 top-1 w-4 h-4 rounded-full bg-[#10B981] shadow-[0_0_15px_#10B981]" />
          <h3 className="text-2xl font-bold text-[#10B981]">Future Destination (2030)</h3>
          <p className="text-white/60">{destination} tons / year</p>
        </div>

        {[...roadmap.phases].reverse().map((p: RoadmapPhase, i: number) => (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} key={p.phase} className="relative pl-24 mb-12">
            <div className="absolute left-[22px] top-4 w-3 h-3 rounded-full bg-white/20 border-2 border-white/50" />
            <div className="surface-card p-6 rounded-2xl border-l-4 border-l-[#4F46E5]">
              <p className="text-sm text-white/50 font-bold uppercase tracking-wider mb-2">{p.title}: {p.months}</p>
              {p.actions.map((act: RoadmapAction, j: number) => (
                 <div key={j} className="mb-3">
                    <h4 className="text-xl font-bold mb-1">{act.action}</h4>
                    <p className="text-[#22D3EE] font-medium">-{(act.impact_kg / 1000).toFixed(2)} CO₂</p>
                 </div>
              ))}
            </div>
          </motion.div>
        ))}

        <div className="relative pl-24">
          <div className="absolute left-5 top-1 w-5 h-5 rounded-full border-4 border-white bg-[#09090B]" />
          <h3 className="text-xl font-bold">Today ({baselineTotal.toFixed(1)} tons)</h3>
        </div>
      </div>

      <button onClick={onContinue} aria-label="See My Future Setup" className="mt-12 px-8 py-4 bg-[#10B981] text-black rounded-full font-bold text-lg hover:bg-[#059669] transition-all">
        See My Future Setup
      </button>
    </motion.div>
  );
});
