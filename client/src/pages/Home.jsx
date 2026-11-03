import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/Landing.css';

// Import modular landing components
import Navbar from '../components/landing/Navbar';
import CinematicHero from '../components/ui/cinematic-hero';
import ProblemSection from '../components/landing/ProblemSection';
import VerificationJourney from '../components/landing/VerificationJourney';
import TrustIntelligence from '../components/landing/TrustIntelligence';
import ProductPrinciples from '../components/landing/ProductPrinciples';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Route authenticated users to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page-root bg-[#030712] min-h-screen text-slate-100 overflow-x-hidden">
      <Navbar />
      <CinematicHero />
      <div id="problem">
        <ProblemSection />
      </div>
      <div id="how-it-works">
        <VerificationJourney />
      </div>
      <div id="why">
        <TrustIntelligence />
      </div>
      <ProductPrinciples />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
