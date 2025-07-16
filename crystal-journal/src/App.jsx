// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { useKonamiCode } from './hooks/useKonamiCode'; // Import the hook

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CrystalPage from './pages/CrystalPage';
import Loader from './components/Loader';

function App() {
  const [user, loading] = useAuthState(auth);
  const [isRainbowMode, setIsRainbowMode] = useState(false);

  // Activate Rainbow Dash mode when the Konami code is entered!
  useKonamiCode(() => {
    setIsRainbowMode(true);
    alert("Friendship is Magic!");
  });

  if (loading) {
    return <Loader />;
  }
  
  return (
    <Router>
      {/* The sparkle background is always there */}
      <div className="sparkle-bg"></div>
      {/* Add the rainbow-dash-mode class when activated */}
      <div className={`App ${isRainbowMode ? 'rainbow-dash-mode' : ''}`}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/crystal/:crystalId" element={<CrystalPage />} />
        </Routes>
        <footer className="footer">
          "Friendship is Magic"
        </footer>
      </div>
    </Router>
  );
}

export default App;