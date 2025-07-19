// src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { themes } from './themes';

import Navbar from './components/Navbar';
import Loader from './components/Loader';
import JournalListPage from './pages/JournalListPage';
import JournalPage from './pages/JournalPage';
import ItemPage from './pages/ItemPage';
import SnakeGamePage from './pages/SnakeGamePage';

function App() {
  const [user, loading] = useAuthState(auth);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const appRef = useRef(null); // Ref for the main container

  const toggleRainbowMode = () => setIsRainbowMode(prev => !prev);
  const cycleTheme = () => setThemeIndex(prev => (prev + 1) % themes.length);

  const currentTheme = themes[themeIndex];
  const isHoloTheme = currentTheme.name === "Holo-Projector";

  // Effect to apply theme colors
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(currentTheme.colors)) {
      root.style.setProperty(key, value);
    }
  }, [themeIndex]);

  // Effect for interactive hologram tilt
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!appRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const rotX = (clientY / innerHeight - 0.5) * -30; // Rotate up/down
      const rotY = (clientX / innerWidth - 0.5) * 30;  // Rotate left/right
      appRef.current.style.setProperty('--rotX', `${rotX}deg`);
      appRef.current.style.setProperty('--rotY', `${rotY}deg`);
    };

    if (isHoloTheme) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHoloTheme]);

  if (loading) return <Loader text="Booting Neural Interface..." />;

  // Conditionally wrap the app in the hologram structure
  const AppContent = (
    <div ref={appRef} className={`App ${isRainbowMode ? 'rainbow-dash-mode' : ''}`}>
      <Navbar 
        user={user} 
        onThemeClick={cycleTheme}
        toggleRainbowMode={toggleRainbowMode}
      />
      <Routes>
        <Route path="/" element={<JournalListPage user={user} />} />
        <Route path="/journal/:journalId" element={<JournalPage user={user} />} />
        <Route path="/journal/:journalId/item/:itemId" element={<ItemPage user={user} />} />
        <Route path="/snake-game" element={<SnakeGamePage user={user} />} />
      </Routes>
    </div>
  );

  return (
    <Router>
      <div className={`background-container ${currentTheme.bgClass}`}>
        {isHoloTheme ? (
          <div className="hologram-wrapper">
            <div className="holo-scanlines"></div>
            <div className="holo-projector">
              <div className="projector-base"></div>
              <div className="projector-light"></div>
            </div>
            {AppContent}
          </div>
        ) : (
          AppContent
        )}
      </div>
    </Router>
  );
}

export default App;
