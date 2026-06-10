import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { TwinData } from '@/lib/types';
import { calculateFootprint, translateToEquivalents } from '@/lib/carbonEngine';

export const SimulatorView = memo(function SimulatorView({ twinData, onUpdate, onContinue }: { twinData: TwinData, onUpdate: (flights: number) => void, onContinue: () => void }) {
  const [flights, setFlights] = useState(parseInt(String(twinData.flights)) || 4);
  
  const currentTotal = useMemo(() => 
    calculateFootprint({ ...twinData, flights: flights.toString() }).total, 
    [twinData, flights]
  );
  
  const equivs = useMemo(() => 
    translateToEquivalents(currentTotal), 
    [currentTotal]
  );

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setFlights(val);
    onUpdate(val);
  }, [onUpdate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl flex flex-col items-center text-center">
      <h2 className="text-[48px] font-bold mb-16">What if you changed one thing?</h2>
      
      <div className="surface-card p-12 rounded-[2rem] w-full mb-12 flex flex-col items-center">
        <p className="text-xl text-white/50 mb-4">Projected Footprint</p>
        <h3 className="text-[80px] font-bold leading-none mb-4 tabular-data text-gradient">{currentTotal.toFixed(1)} <span className="text-3xl text-white/40">tons</span></h3>
        
        <div className="flex gap-8 mb-8 text-white/60">
          <div><span className="font-bold text-white">{equivs.trees.toLocaleString()}</span> Trees</div>
          <div><span className="font-bold text-white">{equivs.km_driven.toLocaleString()}</span> Km Driven</div>
          <div><span className="font-bold text-white">{equivs.phone_charges.toLocaleString()}</span> Charges</div>
        </div>

        <div className="w-full max-w-md mt-4">
          <div className="flex justify-between mb-4 text-white/60">
            <span>0 Flights</span>
            <span className="text-white font-bold">{flights} Flights / yr</span>
            <span>12+ Flights</span>
          </div>
          <input 
            type="range" min="0" max="12" value={flights} 
            onChange={handleSliderChange} 
            className="w-full h-2 bg-[#1F2937] rounded-full appearance-none accent-[#22D3EE]" 
            aria-label="Adjust flight count" aria-valuemin={0} aria-valuemax={12} aria-valuenow={flights}
          />
        </div>
      </div>

      <button onClick={onContinue} className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all">
        Build My Full Roadmap
      </button>
    </motion.div>
  );
});
