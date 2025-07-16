// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CrystalPage from './pages/CrystalPage';
import Loader from './components/Loader';

function App() {
  const [user, loading] = useAuthState(auth);
  const [isRainbowMode, setIsRainbowMode] = useState(false);

  // Function to toggle the rainbow mode state
  const toggleRainbowMode = () => {
    setIsRainbowMode(prevMode => !prevMode);
  };

  if (loading) {
    return <Loader />;
  }
  
  return (
    <Router>
      <div className="sparkle-bg"></div>
      <div className={`App ${isRainbowMode ? 'rainbow-dash-mode' : ''}`}>
        <Navbar 
          isRainbowMode={isRainbowMode} 
          toggleRainbowMode={toggleRainbowMode} 
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/crystal/:crystalId" element={<CrystalPage />} />
        </Routes>
        <footer className="footer">
          "Friendship is Magic",
          "I love you Camy";
        </footer>
      </div>
    </Router>
  );
}

export default App;