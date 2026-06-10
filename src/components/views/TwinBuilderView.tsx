import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TwinData } from '@/lib/types';

export function TwinBuilderView({ data, onUpdate, onComplete }: { data: TwinData, onUpdate: (d: TwinData) => void, onComplete: () => void }) {
  const [qIndex, setQIndex] = useState(0);
  const questions = [
    { key: 'location', title: 'Where are you based?', options: ['Mumbai', 'Delhi', 'Bengaluru', 'Other'] },
    { key: 'housing', title: 'What is your housing situation?', options: ['Apartment', 'Independent House', 'Shared'] },
    { key: 'commute', title: 'How do you commute mostly?', options: ['Car (Petrol)', 'Car (EV)', 'Metro/Train', 'Two-Wheeler'] },
    { key: 'diet', title: 'What best describes your diet?', options: ['High Meat', 'Average Omnivore', 'Vegetarian', 'Vegan'] },
    { key: 'flights', title: 'Domestic flights per year?', options: ['0-2', '3-6', '7-12', '12+'] },
  ];

  const currentQ = questions[qIndex];
  const progress = (qIndex) / questions.length;

  const handleSelect = (val: string) => {
    onUpdate({ ...data, [currentQ.key]: val });
    if (qIndex < questions.length - 1) setQIndex(qIndex + 1);
    else onComplete();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
      <motion.div 
        animate={{ scale: 1 + progress * 0.5, rotate: progress * 180, background: `radial-gradient(circle, ${progress > 0.5 ? '#10B981' : '#22D3EE'} 0%, #4F46E5 100%)` }}
        transition={{ type: "spring", stiffness: 50 }}
        className="w-32 h-32 rounded-full blur-[2px] opacity-80 mb-12 shadow-2xl flex items-center justify-center relative"
      >
        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md animate-pulse" />
      </motion.div>

      <div className="w-full max-w-xl">
        <h2 className="text-3xl md:text-[40px] font-bold mb-8 text-center">{currentQ.title}</h2>
        <div className="grid grid-cols-1 gap-4">
          {currentQ.options.map(opt => (
            <button key={opt} onClick={() => handleSelect(opt)} aria-label={`Select ${opt}`} className="surface-card p-6 rounded-2xl text-xl hover:bg-[#1F2937] hover:border-[#4F46E5]/50 transition-all text-center">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
