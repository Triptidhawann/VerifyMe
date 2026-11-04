"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  ArrowRight,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* Physical Skeuomorphic Materials */
  .text-3d-matte {
      color: #F8FAFC;
      text-shadow: 
          0 10px 30px rgba(0, 0, 0, 0.8), 
          0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .text-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #94A3B8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: 
          drop-shadow(0px 10px 20px rgba(0, 0, 0, 0.7)) 
          drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.4));
  }

  .text-card-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: 
          drop-shadow(0px 12px 24px rgba(0,0,0,0.8)) 
          drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  /* Deep Physical Card with Dynamic Mouse Lighting */
  .premium-depth-card {
      background: linear-gradient(145deg, #0F172A 0%, #030712 100%);
      box-shadow: 
          0 40px 100px -20px rgba(0, 0, 0, 0.95),
          0 20px 40px -20px rgba(0, 0, 0, 0.85),
          inset 0 1px 2px rgba(255, 255, 255, 0.2),
          inset 0 -2px 4px rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.15) 0%, transparent 40%);
      mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .floating-ui-badge {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.88) 100%);
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.14),
          0 20px 40px -10px rgba(0, 0, 0, 0.85),
          inset 0 1px 1px rgba(255, 255, 255, 0.25),
          inset 0 -1px 1px rgba(0, 0, 0, 0.6);
  }

  /* 3D Robot Image Integration */
  .ai-robot-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
  }

  .ai-robot-wrapper::after {
      content: '';
      position: absolute;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(16, 185, 129, 0.08) 35%, transparent 65%);
      z-index: -1;
      border-radius: 50%;
      filter: blur(45px);
      animation: pulseCore 6s ease-in-out infinite;
  }

  @keyframes pulseCore {
      0%, 100% { transform: scale(0.92); opacity: 0.6; }
      50% { transform: scale(1.15); opacity: 0.9; }
  }

  .ai-robot-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 25px 45px rgba(0, 0, 0, 0.85));
      animation: floatRobot 6s ease-in-out infinite;
  }

  @keyframes floatRobot { 
      0% { transform: translateY(0) rotate(0deg); } 
      25% { transform: translateY(-12px) rotate(1.2deg); } 
      50% { transform: translateY(-24px) rotate(0deg); } 
      75% { transform: translateY(-10px) rotate(-1.2deg); } 
      100% { transform: translateY(0) rotate(0deg); } 
  }

  .robot-floor-shadow {
      position: absolute;
      bottom: 0%;
      left: 50%;
      transform: translateX(-50%);
      width: 220px;
      height: 18px;
      background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(12px);
      animation: shadowPulse 6s ease-in-out infinite;
      z-index: 0;
  }

  @keyframes shadowPulse {
      0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.85; }
      50% { transform: translateX(-50%) scale(0.75); opacity: 0.4; }
  }

  /* Physical Tactile Buttons */
  .btn-modern-light, .btn-modern-dark {
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
      background: linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 100%);
      color: #0F172A;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 12px -2px rgba(0,0,0,0.15), 0 20px 32px -6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:active {
      transform: translateY(1px);
      background: linear-gradient(180deg, #F1F5F9 0%, #CBD5E1 100%);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.02);
  }
  .btn-modern-dark {
      background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
      color: #FFFFFF;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #334155 0%, #1E293B 100%);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 6px 12px -2px rgba(0,0,0,0.7), 0 20px 32px -6px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:active {
      transform: translateY(1px);
      background: #0F172A;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 8px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.5);
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
}

export function CinematicHero({ 
  brandName = "VerifyMe",
  tagline1 = "Verify before you trust,",
  tagline2 = "not after you compromise.",
  cardHeading = "Know Before You Trust.",
  cardDescription = "Autonomous intelligence verifying unknown callers, senders, and links before you engage.",
  metricValue = 98,
  metricLabel = "Trust Score Index",
  ctaHeading = "Stop threats in their tracks.",
  ctaDescription = "Deterministic signal verification and real-time threat scoring built for modern high-stakes communication.",
  className, 
  ...props 
}: CinematicHeroProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  // 1. High-Performance Mouse Interaction Logic (Using requestAnimationFrame)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;

      cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

          gsap.to(mockupRef.current, {
            rotationY: xVal * 10,
            rotationX: -yVal * 10,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // 2. Complex Cinematic Scroll Timeline
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=7000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 300, z: -500, rotationX: 40, rotationY: -20, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".floating-badge", { y: 60, autoAlpha: 0, scale: 0.75, rotationZ: -6 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0")
        .fromTo(".card-left-text", { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".card-right-text", { x: 40, autoAlpha: 0, scale: 0.9 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 2.5 })
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .set(".cta-wrapper", { autoAlpha: 1 }) 
        .to({}, { duration: 1.5 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        .to(".main-card", { 
          width: isMobile ? "92vw" : "85vw", 
          height: isMobile ? "92vh" : "85vh", 
          borderRadius: isMobile ? "32px" : "40px", 
          ease: "expo.inOut", 
          duration: 1.8 
        }, "pullback") 
        .to(".cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        .to(".main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]); 

  return (
    <div
      ref={containerRef}
      className={cn("relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#030712] text-white font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-40" aria-hidden="true" />

      {/* BACKGROUND LAYER 1: Hero Texts */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform transform-style-3d">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" /> Next-Gen AI & Deterministic Trust Engine
        </div>
        <h1 className="text-track gsap-reveal text-3d-matte text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-2">
          {tagline1}
        </h1>
        <h1 className="text-days gsap-reveal text-silver-matte text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tighter">
          {tagline2}
        </h1>
      </div>

      {/* BACKGROUND LAYER 2: Tactile CTA Buttons */}
      <div className="cta-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl px-6 gsap-reveal pointer-events-auto will-change-transform">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-5 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ready for Production Verification</span>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 tracking-tight text-silver-matte max-w-3xl leading-tight">
          {ctaHeading}
        </h2>
        <p className="text-slate-300 text-sm sm:text-base md:text-lg mb-8 max-w-xl mx-auto font-normal leading-relaxed">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center justify-center w-full sm:w-auto">
          <Link
            to="/signup"
            className="btn-modern-light inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-xl group font-semibold text-slate-950 text-sm sm:text-base tracking-normal whitespace-nowrap min-w-[200px] shadow-lg shadow-black/30"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-600 transition-transform group-hover:scale-110 flex-shrink-0" />
            <span>Launch Free Audit</span>
          </Link>
          <Link
            to="/login"
            className="btn-modern-dark inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-xl group font-semibold text-white text-sm sm:text-base tracking-normal whitespace-nowrap min-w-[200px] border border-slate-700/80 shadow-lg shadow-black/40"
          >
            <Lock className="w-4 h-4 text-slate-400 group-hover:text-white flex-shrink-0 transition-colors" />
            <span>Sign In to Workspace</span>
          </Link>
        </div>
      </div>

      {/* FOREGROUND LAYER: The Physical Deep Blue Card with Prominent 3D Robot in Center */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* DYNAMIC RESPONSIVE 3-PART LAYOUT */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-12 items-center lg:gap-8 z-10 py-6 lg:py-0">
            
            {/* 1. LEFT: MINIMAL PUNCHY HEADLINE & VALUE PROP (Desktop Col 1-3) */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 lg:col-span-3 flex flex-col justify-center text-center lg:text-left z-20 w-full">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-indigo-400 mb-2 block">
                Autonomous Security
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Know Before<br />
                <span className="text-silver-matte">You Trust.</span>
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-normal leading-relaxed max-w-xs mx-auto lg:mx-0">
                {cardDescription}
              </p>
            </div>

            {/* 2. CENTER: 3D AI ROBOT HERO (Prominently Sized, Commanding Center Stage) */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 lg:col-span-6 relative w-full h-[420px] sm:h-[500px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1200px" }}>
              <div className="relative w-full h-full flex items-center justify-center">
                
                {/* 3D Parallax Robot Wrapper (Larger dimensions to make robot prominent) */}
                <div
                  ref={mockupRef}
                  className="relative w-[320px] sm:w-[420px] lg:w-[490px] h-[380px] sm:h-[480px] lg:h-[560px] flex items-center justify-center will-change-transform transform-style-3d select-none"
                >
                  {/* The 3D Robot Image & Floor Shadow */}
                  <div className="ai-robot-wrapper relative w-full h-full flex items-center justify-center">
                    <img 
                      src="/robot-assistant.jpg" 
                      alt="VerifyMe Autonomous AI Robot Assistant" 
                      className="ai-robot-image w-full h-full object-contain transform scale-110 sm:scale-115" 
                    />
                    <div className="robot-floor-shadow"></div>
                  </div>

                  {/* Clean Floating Badges Framing the Larger Robot */}
                  
                  {/* Badge 1: Top Left - AI Scam Shield */}
                  <div className="floating-badge absolute top-2 sm:top-6 -left-2 sm:left-1 floating-ui-badge rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 z-30 pointer-events-auto">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40 shadow-inner">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold tracking-tight leading-none">AI Scam Shield</p>
                      <p className="text-emerald-300 text-[10px] font-semibold mt-0.5">Zero Threat Detected</p>
                    </div>
                  </div>

                  {/* Badge 2: Middle Right - 0.18s Latency */}
                  <div className="floating-badge absolute top-1/2 -translate-y-1/2 -right-2 sm:right-1 floating-ui-badge rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 z-30 pointer-events-auto">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/40 shadow-inner">
                      <Zap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold tracking-tight leading-none">0.18s Latency</p>
                      <p className="text-indigo-200 text-[10px] font-semibold mt-0.5">Deterministic Core</p>
                    </div>
                  </div>

                  {/* Badge 3: Bottom Left - Trust Score: 98/100 */}
                  <div className="floating-badge absolute bottom-2 sm:bottom-6 left-1 sm:left-3 floating-ui-badge rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 z-30 pointer-events-auto">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40 text-emerald-400 font-mono font-bold text-xs shadow-inner">
                      <span className="counter-val">98</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold tracking-tight leading-none">Trust Score: 98/100</p>
                      <p className="text-slate-400 text-[10px] font-medium mt-0.5">Low Risk Verified</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* 3. RIGHT: MINIMAL BRANDING & LIVE TELEMETRY PILL (Desktop Col 10-12) */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 lg:col-span-3 flex justify-center lg:justify-end z-20 w-full">
              <div className="flex flex-col items-center lg:items-end text-center lg:text-right gap-2.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time Sentinel</span>
                </span>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-card-silver-matte leading-none">
                  VERIFY<span className="text-indigo-400">ME</span>
                </h2>

                <div className="p-2 px-3 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-md flex items-center gap-2.5 mt-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-mono text-slate-300 font-semibold tracking-wider">
                    99.8% TRUST ACCURACY
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default CinematicHero;
