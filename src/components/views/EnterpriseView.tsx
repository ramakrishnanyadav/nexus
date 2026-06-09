import React from 'react';
import { motion } from 'framer-motion';

export function EnterpriseView() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl text-center">
      <div className="mb-16">
        <h2 className="text-[64px] font-bold mb-4 text-[#F9FAFB]">B2B Intelligence Layer</h2>
        <p className="text-2xl text-white/50">Aggregated insights for organizations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="surface-card p-8 rounded-3xl">
          <p className="text-white/50 mb-2">Company Target</p>
          <h3 className="text-5xl font-bold tabular-data">-25%</h3>
        </div>
        <div className="surface-elevated p-8 rounded-3xl border-[#22D3EE]/30">
          <p className="text-[#22D3EE] mb-2">Current Reduction</p>
          <h3 className="text-5xl font-bold tabular-data text-[#22D3EE]">-12.4%</h3>
        </div>
        <div className="surface-card p-8 rounded-3xl">
          <p className="text-white/50 mb-2">Employee Participation</p>
          <h3 className="text-5xl font-bold tabular-data">68%</h3>
        </div>
      </div>
    </motion.div>
  );
}
