import React from 'react';
import { Compass } from 'lucide-react';

const VerificationJourney = () => {
  return (
    <section id="how-it-works" className="section-padding relative overflow-hidden bg-[#FAFCFA]">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="section-title text-center max-w-3xl mx-auto mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono uppercase tracking-wider mb-4 shadow-sm">
            <Compass className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>Deterministic Verification Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202923] tracking-tight mb-4">
            How VerifyMe Works
          </h2>
          <p className="text-[#737D76] text-base sm:text-lg leading-relaxed">
            From raw unknown signals to confident, explainable decision evidence.
          </p>
        </div>
        
        {/* CONCEPTUAL FLOW */}
        <div className="journey-container relative max-w-5xl mx-auto">
          <div className="journey-line"></div>
          
          <div className="journey-step">
            <div className="journey-node">01</div>
            <h4 className="font-bold text-[#202923] text-base mb-1">Enter</h4>
            <p className="text-xs text-[#737D76]">Provide an unknown entity or document.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">02</div>
            <h4 className="font-bold text-[#202923] text-base mb-1">Collect</h4>
            <p className="text-xs text-[#737D76]">Gather carrier, DNS, or signature signals.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">03</div>
            <h4 className="font-bold text-[#202923] text-base mb-1">Analyze</h4>
            <p className="text-xs text-[#737D76]">Correlate cross-vector threat intelligence.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">04</div>
            <h4 className="font-bold text-[#202923] text-base mb-1">Explain</h4>
            <p className="text-xs text-[#737D76]">Generate human-readable Evidence Ledger.</p>
          </div>
          
          <div className="journey-step">
            <div className="journey-node">05</div>
            <h4 className="font-bold text-[#202923] text-base mb-1">Decide</h4>
            <p className="text-xs text-[#737D76]">Act with empirical certainty.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerificationJourney;
