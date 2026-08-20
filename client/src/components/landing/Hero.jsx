import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="container hero-grid">
        
        {/* Left Content */}
        <div className="hero-content animate-fade-up">
          <h1>Know Before<br />You Trust.</h1>
          <p>
            VerifyMe is a digital trust intelligence platform that helps you investigate unknown digital entities before you respond, share information, or click.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/signup" className="btn">Start Verifying</Link>
            <a href="#how-it-works" className="btn btn-secondary">See How It Works</a>
          </div>
        </div>
        
        {/* Right Content - Full Size 3D Robot */}
        <div className="hero-visual-container animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="ai-robot-wrapper full-size">
            <img src="/robot-assistant.jpg" alt="AI Verification Robot" className="ai-robot-image" />
            <div className="robot-floor-shadow"></div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
