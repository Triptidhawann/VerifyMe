import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

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
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 100,
      padding: scrolled ? '0.85rem 0' : '1.25rem 0',
      background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(250, 252, 250, 0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid #E7EEE9' : '1px solid transparent',
      boxShadow: scrolled ? '0 2px 12px rgba(0, 0, 0, 0.03)' : 'none',
      transition: 'all 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            backgroundColor: '#EFF8F3',
            border: '1px solid #D2E8DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2E7D5B',
            boxShadow: '0 2px 4px rgba(73, 185, 154, 0.1)'
          }}>
            <ShieldCheck style={{ width: '20px', height: '20px' }} />
          </div>
          <span style={{ color: '#202923', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Verify<span style={{ color: '#49B99A' }}>Me</span>
          </span>
        </Link>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="desktop-nav">
          <a href="#problem" style={{ color: '#556058', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
            Features
          </a>
          <a href="#how-it-works" style={{ color: '#556058', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
            How It Works
          </a>
          <Link to="/jobshield" style={{ 
            color: '#2E7D5B', 
            textDecoration: 'none', 
            fontSize: '0.8125rem', 
            fontWeight: 600,
            backgroundColor: '#EFF8F3',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #D2E8DB',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <span>JobShield</span>
          </Link>
          <Link to="/credentialcheck" style={{ 
            color: '#2E7D5B', 
            textDecoration: 'none', 
            fontSize: '0.8125rem', 
            fontWeight: 600,
            backgroundColor: '#EFF8F3',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #D2E8DB',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <span>CredentialCheck</span>
          </Link>
          <a href="#why" style={{ color: '#556058', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
            Why VerifyMe
          </a>
        </div>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/login" style={{ color: '#202923', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
            Sign In
          </Link>
          <Link 
            to="/signup" 
            style={{ 
              padding: '0.5rem 1.15rem', 
              backgroundColor: '#49B99A',
              color: '#FFFFFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(73, 185, 154, 0.25)',
              transition: 'background-color 0.15s'
            }}
          >
            <span>Start Free</span>
            <ArrowRight style={{ width: '14px', height: '14px' }} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
