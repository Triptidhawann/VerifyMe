"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  ArrowRight,
  Activity,
  Briefcase,
  FileCheck2
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
      pointer-events: none; z-index: 50; opacity: 0.02; mix-blend-mode: multiply;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, rgba(73, 185, 154, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(73, 185, 154, 0.08) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* Physical Materials - Fresh Mint + White */
  .text-3d-matte {
      color: #202923;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }

  .text-silver-matte {
      background: linear-gradient(180deg, #202923 0%, #2E7D5B 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
  }

  .text-card-silver-matte {
      background: linear-gradient(180deg, #202923 0%, #556058 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
  }

  /* Physical Card with Fresh Mint Theme */
  .premium-depth-card {
      background: linear-gradient(145deg, #FFFFFF 0%, #F4F9F6 100%);
      box-shadow: 
          0 30px 80px -20px rgba(0, 0, 0, 0.08),
          0 10px 25px -10px rgba(73, 185, 154, 0.1),
          inset 0 1px 2px rgba(255, 255, 255, 1),
          inset 0 -1px 2px rgba(0, 0, 0, 0.03);
      border: 1px solid #E7EEE9;
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(73, 185, 154, 0.12) 0%, transparent 40%);
      mix-blend-mode: multiply; transition: opacity 0.3s ease;
  }

  .floating-ui-badge {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px); 
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 
          0 0 0 1px #E7EEE9,
          0 12px 30px -8px rgba(0, 0, 0, 0.08),
          inset 0 1px 1px rgba(255, 255, 255, 1);
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
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 440px;
      height: 440px;
      background: radial-gradient(circle, rgba(73, 185, 154, 0.22) 0%, rgba(239, 248, 243, 0.75) 42%, transparent 70%);
      z-index: 0;
      border-radius: 50%;
      filter: blur(36px);
      pointer-events: none;
      animation: pulseCore 6s ease-in-out infinite;
  }

  @keyframes pulseCore {
      0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.7; }
      50% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.95; }
  }

  .ai-robot-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 18px 28px rgba(32, 41, 35, 0.12)) drop-shadow(0 4px 12px rgba(73, 185, 154, 0.15));
      animation: floatRobot 6s ease-in-out infinite;
      position: relative;
      z-index: 5;
  }

  @keyframes floatRobot { 
      0% { transform: translateY(0) rotate(0deg); } 
      25% { transform: translateY(-12px) rotate(1.2deg); } 
      50% { transform: translateY(-24px) rotate(0deg); } 
      75% { transform: translateY(-10px) rotate(-1.2deg); } 
      100% { transform: translateY(0) rotate(0deg); } 
  }

  .robot-pedestal-ring {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 250px;
      height: 65px;
      border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(73, 185, 154, 0.14) 0%, rgba(239, 248, 243, 0.05) 50%, transparent 75%);
      border: 1.5px solid rgba(73, 185, 154, 0.35);
      box-shadow: 0 0 20px rgba(73, 185, 154, 0.22);
      pointer-events: none;
      z-index: 1;
  }

  .robot-floor-shadow {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 210px;
      height: 20px;
      background: radial-gradient(ellipse at center, rgba(32, 41, 35, 0.18) 0%, rgba(73, 185, 154, 0.06) 45%, transparent 75%);
      border-radius: 50%;
      filter: blur(8px);
      animation: shadowPulse 6s ease-in-out infinite;
      z-index: 2;
      pointer-events: none;
  }

  @keyframes shadowPulse {
      0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.85; }
      50% { transform: translateX(-50%) scale(0.72); opacity: 0.38; }
  }

  /* Tactile Buttons - Fresh Mint & Charcoal */
  .btn-modern-light, .btn-modern-dark {
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
      background: #49B99A;
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(73, 185, 154, 0.3);
  }
  .btn-modern-light:hover {
      transform: translateY(-2px);
      background: #3AA385;
      box-shadow: 0 6px 20px rgba(73, 185, 154, 0.4);
  }
  .btn-modern-light:active {
      transform: translateY(1px);
  }
  .btn-modern-dark {
      background: #FFFFFF;
      color: #202923;
      border: 1px solid #DCE5DF;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }
  .btn-modern-dark:hover {
      transform: translateY(-2px);
      background: #F4F7F4;
      border-color: #CBD5CD;
  }
  .btn-modern-dark:active {
      transform: translateY(1px);
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
  cardDescription = "Autonomous intelligence verifying unknown callers, senders, links, job offers, and credentials before you engage.",
  metricValue = 98,
  metricLabel = "Trust Score Index",
  ctaHeading = "Stop fraud and deception in their tracks.",
  ctaDescription = "Multi-entity signal inspection, live ATS job matching, and statutory document forensics built for high-stakes digital decisions.",
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

  // 2. Complex Cinematic Scroll Timeline - Preserved Exactly
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
      className={cn("relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#FAFCFA] text-[#202923] font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-60" aria-hidden="true" />

      {/* BACKGROUND LAYER 1: Hero Texts */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform transform-style-3d">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-[#49B99A]" /> Multi-Vector Digital Verification Platform
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFF8F3] border border-[#D2E8DB] text-[#2E7D5B] text-xs font-semibold uppercase tracking-wider mb-5 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-[#49B99A]" />
          <span>Production-Grade Verification Intelligence</span>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 tracking-tight text-[#202923] max-w-3xl leading-tight">
          {ctaHeading}
        </h2>
        <p className="text-[#556058] text-sm sm:text-base md:text-lg mb-8 max-w-xl mx-auto font-normal leading-relaxed">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center justify-center w-full sm:w-auto">
          <Link
            to="/signup"
            className="btn-modern-light inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-xl group font-semibold text-sm sm:text-base tracking-normal whitespace-nowrap min-w-[200px]"
          >
            <ShieldCheck className="w-5 h-5 text-white transition-transform group-hover:scale-110 flex-shrink-0" />
            <span>Launch Free Audit</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
          <Link
            to="/login"
            className="btn-modern-dark inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-xl group font-semibold text-sm sm:text-base tracking-normal whitespace-nowrap min-w-[200px]"
          >
            <Lock className="w-4 h-4 text-[#737D76] group-hover:text-[#202923] flex-shrink-0 transition-colors" />
            <span>Sign In to Workspace</span>
          </Link>
        </div>
      </div>

      {/* FOREGROUND LAYER: The Physical Mint & White Card with Prominent 3D Robot in Center */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* DYNAMIC RESPONSIVE 3-PART LAYOUT */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-12 items-center lg:gap-8 z-10 py-6 lg:py-0">
            
            {/* 1. LEFT: MINIMAL PUNCHY HEADLINE & VALUE PROP */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 lg:col-span-3 flex flex-col justify-center text-center lg:text-left z-20 w-full">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#2E7D5B] mb-2 block">
                Full-Spectrum Verification
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#202923] tracking-tight leading-tight mb-3">
                Know Before<br />
                <span className="text-silver-matte">You Trust.</span>
              </h3>
              <p className="text-[#556058] text-xs sm:text-sm font-normal leading-relaxed max-w-xs mx-auto lg:mx-0">
                {cardDescription}
              </p>
            </div>

            {/* 2. CENTER: 3D AI ROBOT HERO */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 lg:col-span-6 relative w-full h-[420px] sm:h-[500px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1200px" }}>
              <div className="relative w-full h-full flex items-center justify-center">
                
                <div
                  ref={mockupRef}
                  className="relative w-[320px] sm:w-[420px] lg:w-[490px] h-[380px] sm:h-[480px] lg:h-[560px] flex items-center justify-center will-change-transform transform-style-3d select-none"
                >
                  <div className="ai-robot-wrapper relative w-full h-full flex items-center justify-center">
                    <div className="robot-pedestal-ring" aria-hidden="true" />
                    <img 
                      src="/robot-assistant.png" 
                      alt="VerifyMe Autonomous AI Assistant" 
                      className="ai-robot-image w-full h-full object-contain transform scale-110 sm:scale-115" 
                    />
                    <div className="robot-floor-shadow" aria-hidden="true" />
                  </div>

                  {/* Badge 1: Top Left - JobShield */}
                  <div className="floating-badge absolute top-2 sm:top-6 -left-2 sm:left-1 floating-ui-badge rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 z-30 pointer-events-auto">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF8F3] flex items-center justify-center border border-[#D2E8DB]">
                      <Briefcase className="w-4 h-4 text-[#2E7D5B]" />
                    </div>
                    <div>
                      <p className="text-[#202923] text-xs font-bold tracking-tight leading-none">JobShield Active</p>
                      <p className="text-[#2E7D5B] text-[10px] font-semibold mt-0.5">Live ATS Requisition Match</p>
                    </div>
                  </div>

                  {/* Badge 2: Middle Right - CredentialCheck */}
                  <div className="floating-badge absolute top-1/2 -translate-y-1/2 -right-2 sm:right-1 floating-ui-badge rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 z-30 pointer-events-auto">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF8F3] flex items-center justify-center border border-[#D2E8DB]">
                      <FileCheck2 className="w-4 h-4 text-[#2E7D5B]" />
                    </div>
                    <div>
                      <p className="text-[#202923] text-xs font-bold tracking-tight leading-none">CredentialCheck</p>
                      <p className="text-[#556058] text-[10px] font-semibold mt-0.5">Statutory Registry Corroborated</p>
                    </div>
                  </div>

                  {/* Badge 3: Bottom Left - Trust Score: 98/100 */}
                  <div className="floating-badge absolute bottom-2 sm:bottom-6 left-1 sm:left-3 floating-ui-badge rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 z-30 pointer-events-auto">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF8F3] flex items-center justify-center border border-[#D2E8DB] text-[#2E7D5B] font-mono font-bold text-xs">
                      <span className="counter-val">98</span>
                    </div>
                    <div>
                      <p className="text-[#202923] text-xs font-bold tracking-tight leading-none">Trust Score: 98/100</p>
                      <p className="text-[#556058] text-[10px] font-medium mt-0.5">Evidence Ledger Verified</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* 3. RIGHT: BRANDING & LIVE TELEMETRY PILL */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 lg:col-span-3 flex justify-center lg:justify-end z-20 w-full">
              <div className="flex flex-col items-center lg:items-end text-center lg:text-right gap-2.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#2E7D5B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#49B99A] animate-pulse" />
                  <span>Real-Time Telemetry</span>
                </span>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#202923] leading-none">
                  VERIFY<span className="text-[#49B99A]">ME</span>
                </h2>

                <div className="p-2 px-3 rounded-xl bg-[#FFFFFF] border border-[#E7EEE9] shadow-sm flex items-center gap-2.5 mt-1">
                  <Activity className="w-3.5 h-3.5 text-[#49B99A]" />
                  <span className="text-[10px] font-mono text-[#556058] font-semibold tracking-wider">
                    99.8% AUDIT ACCURACY
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
