import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  LogOut, 
  LayoutDashboard, 
  History, 
  User, 
  Briefcase, 
  FileCheck2,
  Menu,
  X
} from 'lucide-react';
import './DashboardNav.css';

const DashboardNav = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInitial = user?.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : (user?.email?.charAt(0).toUpperCase() || 'U');
    
  const userFirst = user?.displayName 
    ? user.displayName.split(' ')[0] 
    : (user?.email?.split('@')[0] || 'User');

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/jobshield', label: 'Job Offers', icon: Briefcase },
    { to: '/credentialcheck', label: 'Documents', icon: FileCheck2 },
    { to: '/history', label: 'History', icon: History },
    { to: '/profile', label: 'My Account', icon: User }
  ];

  return (
    <header className="dash-nav-header">
      <div className="dash-nav-container">
        {/* Brand Logo */}
        <Link to="/dashboard" className="dash-brand-logo" title="VerifyMe Dashboard">
          <div className="dash-brand-icon">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="dash-brand-text">Verify<span className="brand-accent">Me</span></span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <nav className="dash-center-pills" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link 
                key={item.to}
                to={item.to} 
                className={`dash-pill-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status & User Menu */}
        <div className="dash-right-actions">
          <div className="dash-engine-status" title="Real-time verification engines active">
            <span className="engine-dot" />
            <span className="engine-text">Engines Active</span>
          </div>

          <Link to="/profile" className="dash-user-pill" title="View profile">
            <div className="dash-user-avatar">
              {userInitial}
            </div>
            <span className="dash-user-name">{userFirst}</span>
          </Link>

          <button 
            type="button"
            onClick={logout} 
            className="dash-logout-btn" 
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="dash-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="dash-mobile-menu">
          <div className="dash-mobile-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`dash-mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              className="dash-mobile-link logout"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardNav;
