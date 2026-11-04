import React, { useState } from 'react';
import DashboardNav from '../components/dashboard/DashboardNav';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { User, Mail, Lock, Shield } from 'lucide-react';
import './Dashboard.css';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: name });
      
      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: name });

      setMessage('Profile updated successfully.');
    } catch (err) {
      console.error("Error updating profile:", err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <DashboardNav />
      
      <main className="workspace container profile-workspace">
        <div className="workspace-header">
          <h1>Account Settings</h1>
          <p>Manage your identity and security preferences.</p>
        </div>

        <div className="settings-grid">
          {/* Profile Details */}
          <div className="settings-panel">
            <div className="panel-header">
              <User size={20} />
              <h2>Profile Details</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon-left">
                  <Mail size={16} />
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    title="Email cannot be changed directly here"
                  />
                </div>
                <small>Connected to Firebase Authentication</small>
              </div>

              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="btn btn-primary" disabled={loading || name === user?.displayName}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Account Security (Read Only / Informational for now) */}
          <div className="settings-panel">
            <div className="panel-header">
              <Shield size={20} />
              <h2>Account Security</h2>
            </div>
            
            <div className="security-info">
              <div className="security-item">
                <div className="sec-icon"><Lock size={16} /></div>
                <div className="sec-text">
                  <strong>Password Authentication</strong>
                  <span>Your account is secured with Firebase.</span>
                </div>
              </div>
              <div className="security-item">
                <div className="sec-icon"><Shield size={16} /></div>
                <div className="sec-text">
                  <strong>Account Role</strong>
                  <span className="role-badge">{user?.role || 'USER'}</span>
                </div>
              </div>
            </div>
            
            <p className="security-note">
              To reset your password, please sign out and use the "Forgot Password" option on the login screen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
