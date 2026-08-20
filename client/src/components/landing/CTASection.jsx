import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="section-padding" style={{ textAlign: 'center' }}>
      <div className="container">
        <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Trust is a process.</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
          Investigate the digital identities, messages, and links you encounter before you trust them.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/signup" className="btn" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>Start Verifying</Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
