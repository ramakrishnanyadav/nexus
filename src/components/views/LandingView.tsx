import React from 'react';
import { motion } from 'framer-motion';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

export function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="text-center max-w-3xl flex flex-col items-center">
      <h1 className="text-5xl md:text-[64px] font-bold tracking-tight leading-[1.1] mb-6">Build Your <span className="text-gradient">Climate Future</span></h1>
      <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-lg">Reduce emissions. Save money. See your future.</p>
      <button onClick={onStart} aria-label="Start Your Climate Journey" className="px-8 py-4 bg-[#4F46E5] text-white rounded-full font-bold text-lg hover:bg-[#4338ca] transition-all flex items-center gap-2 shadow-lg shadow-[#4F46E5]/20">
        Start Your Climate Journey <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
