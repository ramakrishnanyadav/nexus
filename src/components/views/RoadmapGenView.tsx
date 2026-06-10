import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const STEPS = ["Analyzing lifestyle...", "Calculating opportunities...", "Sequencing actions...", "Building roadmap..."];

export function RoadmapGenView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= STEPS.length - 1) { clearInterval(interval); return s; }
        return s + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === STEPS.length - 1) {
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-24 h-24 rounded-full border-2 border-dashed border-[#4F46E5] mb-8" />
      <h3 className="text-2xl font-medium text-white/80">{STEPS[step]}</h3>
    </div>
  );
}
