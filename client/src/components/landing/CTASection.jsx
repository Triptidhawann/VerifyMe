import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Zap } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative py-20 sm:py-28 my-8 sm:my-12">
      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Spacious, Deep Cyber Card with Guaranteed Safe Vertical Padding */}
        <div 
          className="relative rounded-3xl sm:rounded-[2.5rem] border border-indigo-500/30 bg-gradient-to-b from-[#0F172A] via-[#0A101D] to-[#030712] px-6 py-14 sm:px-12 sm:py-18 lg:py-20 text-center shadow-2xl shadow-black/80 flex flex-col items-center justify-center"
          style={{ minHeight: '440px' }}
        >
          {/* Subtle Ambient Glow Behind Card */}
          <div 
            className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-25 blur-[120px] rounded-full"
            style={{ background: 'radial-gradient(circle, #6366F1 0%, #06B6D4 50%, transparent 75%)' }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
            {/* 1. Sleek Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-6 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero Risk • Instant Telemetry</span>
            </div>

            {/* 2. Heading with Balanced Line Spacing */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight sm:leading-snug">
              Trust is a process.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-200 bg-clip-text text-transparent block sm:inline">
                Never an assumption.
              </span>
            </h2>

            {/* 3. Subtitle with Comfortable Margin */}
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 max-w-xl mx-auto font-normal">
              Investigate unknown digital identities, phone numbers, and web domains before you take action.
            </p>

            {/* 4. Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-10 w-full sm:w-auto">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap min-w-[210px]"
              >
                <span>Start Free Verification</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link 
                to="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-semibold text-sm sm:text-base transition-colors whitespace-nowrap min-w-[210px]"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Sign In to Workspace</span>
              </Link>
            </div>

            {/* 5. Trust Features: Safely Spaced from Bottom Edge with Zero Risk of Clipping */}
            <div className="w-full max-w-lg mx-auto pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-xs sm:text-sm text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>No credit card required</span>
              </span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Free monthly credits</span>
              </span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Instant AI synthesis</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
