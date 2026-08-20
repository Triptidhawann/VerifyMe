import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/Landing.css';

// Import modular landing components
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import ProblemSection from '../components/landing/ProblemSection';
import VerificationJourney from '../components/landing/VerificationJourney';
import EngineSection from '../components/landing/EngineSection';
import TrustIntelligence from '../components/landing/TrustIntelligence';
import ProductPrinciples from '../components/landing/ProductPrinciples';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Protect landing page from authenticated users (route to dashboard)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      <Hero />
      <ProblemSection />
      <VerificationJourney />
      {/* <EngineSection /> */}
      <TrustIntelligence />
      <ProductPrinciples />
      <CTASection />
      <Footer />
    </>
  );
};

export default Home;
