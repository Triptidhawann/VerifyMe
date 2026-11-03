import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

const Hero = () => {
  return (
    <section className="hero-section relative overflow-hidden">
      {/* Ambient background mesh glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container hero-grid">
        
        {/* Left Content */}
        <div className="hero-content animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous AI Trust Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
            Know Before<br />
            <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              You Trust.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg lg:text-xl mb-8 max-w-xl leading-relaxed">
            VerifyMe unifies military-grade deterministic signal intelligence with Groq AI threat analysis to investigate unknown phone numbers, emails, and website links before you respond, share, or click.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            <Link 
              to="/signup" 
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-b from-white to-slate-200 shadow-[0_4px_14px_rgba(0,0,0,0.3),inset_0_1px_1px_#fff] hover:-translate-y-0.5 transition-all text-sm sm:text-base"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Start Verifying Free</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <a 
              href="#how-it-works" 
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/80 border border-white/10 hover:bg-slate-800/80 hover:border-white/20 hover:-translate-y-0.5 transition-all text-sm sm:text-base backdrop-blur-md"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> E.164 Carrier Intel
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strict SPF & DMARC
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Groq AI Synthesis
            </span>
          </div>
        </div>
        
        {/* Right Content - Full Size 3D AI Robot Assistant */}
        <div className="hero-visual-container animate-fade-up" style={{ animationDelay: '200ms' }}>
          
          {/* Floating Glassmorphic Badges around the 3D Robot */}
          <div className="absolute -top-4 -left-6 z-30 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-xs font-bold font-sans">AI Scam Shield</p>
              <p className="text-emerald-300 text-[10px] font-medium font-sans">Zero Threat Detected</p>
            </div>
          </div>

          <div className="absolute top-1/2 -right-6 z-30 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-white text-xs font-bold font-sans">0.18s Latency</p>
              <p className="text-indigo-200 text-[10px] font-medium font-sans">Deterministic Pipeline</p>
            </div>
          </div>

          <div className="absolute -bottom-4 left-8 z-30 hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-xs font-mono">
              98
            </div>
            <div>
              <p className="text-white text-xs font-bold font-sans">Trust Score: 98/100</p>
              <p className="text-slate-400 text-[10px] font-medium font-sans">Low Risk Verified</p>
            </div>
          </div>

          {/* The 3D Robot Image & Floor Shadow */}
          <div className="ai-robot-wrapper full-size">
            <img 
              src="/robot-assistant.jpg" 
              alt="VerifyMe AI Verification Robot" 
              className="ai-robot-image" 
            />
            <div className="robot-floor-shadow"></div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
