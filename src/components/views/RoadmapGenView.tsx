import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function RoadmapGenView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ["Analyzing lifestyle...", "Calculating opportunities...", "Sequencing actions...", "Building roadmap..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= steps.length - 1) { clearInterval(interval); return s; }
        return s + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-24 h-24 rounded-full border-2 border-dashed border-[#4F46E5] mb-8" />
      <h3 className="text-2xl font-medium text-white/80">{steps[step]}</h3>
    </div>
  );
}
