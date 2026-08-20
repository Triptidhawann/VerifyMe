import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? '1rem 0' : '1.5rem 0',
      background: scrolled ? 'rgba(10, 11, 16, 0.8)' : 'transparent',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
      transition: 'all 0.3s ease'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="logo" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em' }}>
          Verify<span style={{ color: 'var(--accent-primary)' }}>Me</span>
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          <a href="#problem" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }}>Features</a>
          <a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }}>How It Works</a>
          <a href="#why" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s' }}>Why VerifyMe</a>
          <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Login</Link>
          <Link to="/signup" className="btn" style={{ padding: '0.5rem 1.25rem' }}>Start Verifying</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
