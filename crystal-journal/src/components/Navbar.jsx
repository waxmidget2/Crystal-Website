// src/components/Navbar.jsx

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout } from '../firebase';

export default function Navbar({ isRainbowMode, toggleRainbowMode }) {
  const [user] = useAuthState(auth);

  return (
    <nav className="navbar glass-ui">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 className="navbar-title">🔮 Crystal Journal</h1>
        <button 
          className="rainbow-mode-toggle" 
          onClick={toggleRainbowMode}
          title={isRainbowMode ? "Deactivate Rainbow Mode" : "Activate Rainbow Mode"}
        >
          🌈
        </button>
      </div>
      <button className="action-button primary" onClick={user ? logout : signInWithGoogle}>
        {user ? 'Sign Out' : 'Sign In with Google'}
      </button>
    </nav>
  );
}