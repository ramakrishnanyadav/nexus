"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { TwinData, Roadmap } from '@/lib/types';
import { calculateFootprint } from '@/lib/carbonEngine';
import { generateRoadmapAction } from '@/app/actions';
import { 
  LandingView as _LandingView, 
  TwinBuilderView as _TwinBuilderView, 
  SimulatorView as _SimulatorView, 
  RoadmapGenView as _RoadmapGenView, 
  RoadmapJourneyView as _RoadmapJourneyView, 
  CarbonTimeMachineView as _CarbonTimeMachineView, 
  EnterpriseView as _EnterpriseView 
} from '@/components/views';

const LandingView = React.memo(_LandingView);
const TwinBuilderView = React.memo(_TwinBuilderView);
const SimulatorView = React.memo(_SimulatorView);
const RoadmapGenView = React.memo(_RoadmapGenView);
const RoadmapJourneyView = React.memo(_RoadmapJourneyView);
const CarbonTimeMachineView = React.memo(_CarbonTimeMachineView);
const EnterpriseView = React.memo(_EnterpriseView);

type Step = 'landing' | 'twin' | 'simulator' | 'roadmap-gen' | 'roadmap' | 'timemachine' | 'enterprise';

export default function CarbonFuturePlannerV6() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [twinData, setTwinData] = useState<TwinData>({ location: '', housing: '', commute: '', diet: '', flights: '' });
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  const baselineTotal = useMemo(() => calculateFootprint(twinData).total, [twinData]);

  const nextStep = useCallback((step: Step) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(step);
  }, []);

  const handleGenerateRoadmap = useCallback(async () => {
    nextStep('roadmap-gen');
    // Call server action for AI generation
    const generated = await generateRoadmapAction(twinData);
    setRoadmap(generated);
    setTimeout(() => nextStep('roadmap'), 1000); // give the UI a moment to finish its animation cycle
  }, [twinData, nextStep]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F9FAFB] overflow-x-hidden font-sans selection:bg-[#22D3EE]/30">
      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10 min-h-screen flex flex-col">
        {currentStep !== 'landing' && currentStep !== 'enterprise' && (
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center w-full py-4 mb-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => nextStep('landing')}>
              <Leaf className="w-5 h-5 text-[#22D3EE]" />
              <span className="font-bold text-xl tracking-tight">Nexus</span>
            </div>
          </motion.header>
        )}
        
        <div className="flex-grow flex items-center justify-center mt-8">
          <AnimatePresence mode="wait">
            {currentStep === 'landing' && <LandingView key="landing" onStart={() => nextStep('twin')} />}
            {currentStep === 'twin' && <TwinBuilderView key="twin" data={twinData} onUpdate={setTwinData} onComplete={() => nextStep('simulator')} />}
            {currentStep === 'simulator' && <SimulatorView key="simulator" twinData={twinData} onUpdate={(f) => setTwinData(prev => ({...prev, flights: f.toString()}))} onContinue={handleGenerateRoadmap} />}
            {currentStep === 'roadmap-gen' && <RoadmapGenView key="roadmap-gen" onComplete={() => {}} />}
            {currentStep === 'roadmap' && <RoadmapJourneyView key="roadmap" roadmap={roadmap} baselineTotal={baselineTotal} onContinue={() => nextStep('timemachine')} />}
            {currentStep === 'timemachine' && <CarbonTimeMachineView key="timemachine" twinData={twinData} roadmap={roadmap} onContinue={() => nextStep('enterprise')} />}
            {currentStep === 'enterprise' && <EnterpriseView key="enterprise" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
