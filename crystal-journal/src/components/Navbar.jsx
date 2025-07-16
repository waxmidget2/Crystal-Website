import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout } from '../firebase';

export default function Navbar() {
  const [user] = useAuthState(auth);

  return (
    <nav className="navbar">
      {user ? (
        <button className="auth-button" onClick={logout}>
          Logout
        </button>
      ) : (
        <button className="auth-button" onClick={signInWithGoogle}>
          Sign In with Google
        </button>
      )}
    </nav>
  );
}