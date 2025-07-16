// src/components/Navbar.jsx

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout } from '../firebase';

export default function Navbar({ isRainbowMode, toggleRainbowMode, cycleBackgroundEffect }) {
  const [user] = useAuthState(auth);

  return (
    <nav className="navbar glass-ui">
      <div className="nav-left-group">
        <h1 className="navbar-title">🔮 Crystal Journal</h1>
        <button 
          className="nav-button" 
          onClick={toggleRainbowMode}
          title={isRainbowMode ? "Deactivate Rainbow Mode" : "Activate Rainbow Mode"}
        >
          🌈
        </button>
        <button
          className="nav-button"
          onClick={cycleBackgroundEffect}
          title="Change Background Effect"
        >
          🌠
        </button>
      </div>
      <button className="action-button primary" onClick={user ? logout : signInWithGoogle}>
        {user ? 'Sign Out' : 'Sign In with Google'}
      </button>
    </nav>
  );
}