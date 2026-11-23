import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Zap } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative py-20 sm:py-28 my-8 sm:my-12 bg-[#FAFCFA]">
      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Spacious, Fresh Mint Card with Guaranteed Safe Vertical Padding */}
        <div 
          className="relative rounded-3xl sm:rounded-[2.5rem] border border-[#D2E8DB] bg-gradient-to-b from-[#EFF8F3] via-[#FFFFFF] to-[#FAFCFA] px-6 py-14 sm:px-12 sm:py-18 lg:py-20 text-center shadow-xl shadow-[#49B99A]/10 flex flex-col items-center justify-center"
          style={{ minHeight: '440px' }}
        >
          {/* Subtle Ambient Glow Behind Card */}
          <div 
            className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-35 blur-[120px] rounded-full"
            style={{ background: 'radial-gradient(circle, #EFF8F3 0%, #49B99A 50%, transparent 75%)' }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
            {/* 1. Sleek Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D2E8DB] text-[#2E7D5B] text-xs font-mono uppercase tracking-wider mb-6 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-[#2E7D5B]" />
              <span>Zero-Trust Architecture • Real-Time Telemetry</span>
            </div>

            {/* 2. Heading with Balanced Line Spacing */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202923] tracking-tight mb-4 leading-tight sm:leading-snug">
              Trust is a process.{' '}
              <span className="bg-gradient-to-r from-[#2E7D5B] via-[#49B99A] to-[#2E7D5B] bg-clip-text text-transparent block sm:inline">
                Never an assumption.
              </span>
            </h2>

            {/* 3. Subtitle with Comfortable Margin */}
            <p className="text-[#737D76] text-sm sm:text-base lg:text-lg leading-relaxed mb-8 max-w-xl mx-auto font-normal">
              Investigate unknown contacts, job offers, credentials, and web domains before you take action.
            </p>

            {/* 4. Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-10 w-full sm:w-auto">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-xl bg-[#49B99A] hover:bg-[#3ea88b] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#49B99A]/20 hover:shadow-[#49B99A]/30 transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap min-w-[210px]"
              >
                <span>Start Free Investigation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link 
                to="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-[#F4F7F4] border border-[#E7EEE9] text-[#202923] font-semibold text-sm sm:text-base transition-colors whitespace-nowrap min-w-[210px] shadow-sm"
              >
                <Lock className="w-4 h-4 text-[#737D76]" />
                <span>Sign In to Workspace</span>
              </Link>
            </div>

            {/* 5. Trust Features */}
            <div className="w-full max-w-lg mx-auto pt-6 border-t border-[#E7EEE9] flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-xs sm:text-sm text-[#737D76] font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <span>No credit card required</span>
              </span>
              <span className="hidden sm:inline text-[#D2E8DB]">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <span>Free monthly investigations</span>
              </span>
              <span className="hidden sm:inline text-[#D2E8DB]">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <span>Instant Evidence Ledger</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
