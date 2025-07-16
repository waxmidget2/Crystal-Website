import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout } from '../firebase';

export default function Navbar() {
  const [user] = useAuthState(auth);

  return (
    <nav className="navbar glass-ui">
      <h1 className="navbar-title">Crystal Journal</h1>
      <button className="action-button primary" onClick={user ? logout : signInWithGoogle}>
        {user ? 'Sign Out' : 'Sign In with Google'}
      </button>
    </nav>
  );
}