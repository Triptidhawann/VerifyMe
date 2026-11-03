import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, LayoutDashboard, History, User, Activity } from 'lucide-react';
import './DashboardNav.css';

const DashboardNav = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const userInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');
  const userFirst = user?.displayName ? user.displayName.split(' ')[0] : (user?.email?.split('@')[0] || 'User');

  return (
    <nav className="dash-nav-header">
      <div className="dash-nav-container">
        {/* Brand Logo */}
        <Link to="/" className="dash-brand-logo">
          <div className="dash-brand-icon">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="dash-brand-text">Verify<span className="text-indigo-400">Me</span></span>
        </Link>
        
        {/* Center Navigation Links */}
        <div className="dash-center-pills">
          <Link 
            to="/dashboard" 
            className={`dash-pill-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Workspace</span>
          </Link>
          <Link 
            to="/history" 
            className={`dash-pill-link ${location.pathname === '/history' ? 'active' : ''}`}
          >
            <History className="w-4 h-4" />
            <span>Audit History</span>
          </Link>
          <Link 
            to="/profile" 
            className={`dash-pill-link ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </div>

        {/* Right Status & User Menu */}
        <div className="dash-right-actions">
          <div className="dash-engine-status" title="Real-time verification engines online">
            <span className="engine-dot" />
            <span className="engine-text">Core Active</span>
          </div>

          <div className="dash-user-pill">
            <div className="dash-user-avatar">
              {userInitial}
            </div>
            <span className="dash-user-name">{userFirst}</span>
          </div>

          <button 
            onClick={logout} 
            className="dash-logout-btn" 
            title="Terminate session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
