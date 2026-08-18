import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VerificationWidget from '../components/VerificationWidget';
import '../components/Landing.css';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content animate-fade-up">
            <h1>Know Before You Trust.</h1>
            <p>
              Verify phone numbers, email addresses, and website URLs before you respond, share information, or click.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#how-it-works" className="btn btn-secondary">Learn More</a>
            </div>
          </div>
          <div className="hero-visual">
            <VerificationWidget />
          </div>
        </div>
      </section>

      {/* 2. THE TRUST PROBLEM (Light Section) */}
      <section id="problem" className="section-padding bg-light-section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
            <h2>Unknown doesn't mean safe. It means you need more evidence.</h2>
            <p className="text-secondary" style={{ marginTop: '1rem' }}>
              Every day you encounter unknown calls, suspicious emails, and unverified links. 
              VerifyMe helps you gather the evidence needed to make the right decision.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">☎️</span>
              <h3>Unknown Call</h3>
              <p>Who is calling? Is this a known spam operation? Should I call them back?</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">✉️</span>
              <h3>Suspicious Email</h3>
              <p>Is this job offer legitimate? Does the sender domain actually match the organization?</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔗</span>
              <h3>Unknown Link</h3>
              <p>Where does this actually go? Is it a phishing attempt or a secure website?</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT VERIFYME CHECKS */}
      <section id="features" className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2>Evidence over assumptions.</h2>
            <p className="text-secondary" style={{ marginTop: '1rem' }}>
              We collect available signals rather than relying on unsupported claims.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>Know Who's Calling</h3>
              <p>Check available identity, reputation, and community reports for unknown phone numbers.</p>
            </div>
            <div className="feature-card">
              <h3>Understand the Email</h3>
              <p>Examine domain relationships, sender reputation, and structural trust signals.</p>
            </div>
            <div className="feature-card" style={{ borderColor: 'var(--accent-lime)' }}>
              <h3>Inspect Before You Click</h3>
              <p>Link Lens analyzes URL behavior, domain age, and security signals to detect threats.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="section-padding bg-light-section">
        <div className="container">
          <h2 style={{ textAlign: 'center' }}>How VerifyMe Works</h2>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Enter</h3>
              <p className="text-secondary">Input a phone number, email address, or URL.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Analyze</h3>
              <p className="text-secondary">We check available identity, reputation, and security signals.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Understand</h3>
              <p className="text-secondary">Receive clear evidence, risk levels, and a trust score.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Decide</h3>
              <p className="text-secondary">Make a better-informed, confident decision.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXPLAINABLE RISK */}
      <section className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2>Don't just get a verdict. Understand why.</h2>
            <p className="text-secondary" style={{ marginTop: '1rem' }}>
              Transparency is built into every result.
            </p>
          </div>

          <div className="risk-preview-card">
            <div className="risk-header">
              <span className="demo-badge">Interactive Demo</span>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trust Score</div>
              <div className="risk-score">82 / 100</div>
              <div className="risk-level">LOW RISK</div>
            </div>
            
            <div className="risk-body">
              <div className="risk-signal">
                <span className="signal-icon">✓</span>
                <span>Domain established over 5 years ago</span>
              </div>
              <div className="risk-signal">
                <span className="signal-icon">✓</span>
                <span>HTTPS security properly configured</span>
              </div>
              <div className="risk-signal">
                <span className="signal-icon">✓</span>
                <span>Organization domain match verified</span>
              </div>
              
              <div className="risk-recommendation">
                <strong>Recommendation:</strong> No significant warning signals found. Proceed with normal caution.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EVIDENCE PHILOSOPHY */}
      <section id="philosophy" className="section-padding bg-light-section">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2>Evidence, not assumptions.</h2>
            <p className="text-secondary" style={{ marginTop: '1rem', maxWidth: '600px', margin: '1rem auto 0' }}>
              We don't automatically treat unknown contacts as safe or scams. 
              We gather the signals, assess the risk, and explain the result.
            </p>
          </div>

          <div className="philosophy-flow">
            <div className="flow-step">
              <div className="flow-box">Unknown Contact / Link</div>
              <div className="flow-arrow"></div>
            </div>
            <div className="flow-step">
              <div className="flow-box">Collect Available Evidence</div>
              <div className="flow-arrow"></div>
            </div>
            <div className="flow-step">
              <div className="flow-box">Analyze Signals</div>
              <div className="flow-arrow"></div>
            </div>
            <div className="flow-step">
              <div className="flow-box highlight">Explainable Result</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY VERIFYME */}
      <section id="why-verifyme" className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2>Why VerifyMe?</h2>
            <p className="text-secondary" style={{ marginTop: '1rem' }}>
              Designed for confidence and transparency.
            </p>
          </div>

          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">💡</div>
              <div className="why-content">
                <h3>Explainable</h3>
                <p>Understand exactly why a result received its risk level, rather than trusting a black box.</p>
              </div>
            </div>
            <div className="why-card">
              <div className="why-icon">⚡</div>
              <div className="why-content">
                <h3>Unified</h3>
                <p>Phone, email, and URL verification consolidated into one powerful platform.</p>
              </div>
            </div>
            <div className="why-card">
              <div className="why-icon">🔍</div>
              <div className="why-content">
                <h3>Evidence-Based</h3>
                <p>Results are calculated based on verifiable signals and technical relationships.</p>
              </div>
            </div>
            <div className="why-card">
              <div className="why-icon">🛡️</div>
              <div className="why-content">
                <h3>Privacy & Security</h3>
                <p>We treat your user data and verification activity responsibly and securely.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TRUST PROFILES (Future Concept) */}
      <section className="section-padding bg-light-section profile-section">
        <div className="container">
          <h2>Build a digital identity people can verify.</h2>
          <p className="text-secondary" style={{ margin: '1.5rem auto', maxWidth: '600px' }}>
            In the future, users and organizations will be able to establish verified information such as Name, Organization, and Public Profiles.
          </p>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-olive)', textTransform: 'uppercase' }}>
            Coming as VerifyMe evolves
          </span>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="section-padding" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Before you trust it, VerifyMe it.</h2>
          <p className="text-secondary" style={{ fontSize: '1.25rem', marginBottom: '3rem' }}>
            Check the signal. Understand the risk. Make the decision.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/signup" className="btn">Create Account</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
