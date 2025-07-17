// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import Navbar from './components/Navbar';
import Loader from './components/Loader';
import JournalListPage from './pages/JournalListPage';
import JournalPage from './pages/JournalPage';
import ItemPage from './pages/ItemPage';
import TankGamePage from './pages/TankGamePage';
import ThemeDesigner from './components/ThemeDesigner';
import DynamicBackground from './components/DynamicBackground';

const defaultThemeParams = {
  pattern: 'cosmic-noise',
  complexity: 4.0,
  speed: 1.0,
  distortion: 2.0,
  color1: '#2c2a4a',
  color2: '#ff79c6',
  color3: '#8be9fd',
};

function App() {
  const [user, loading] = useAuthState(auth);
  const [themeParams, setThemeParams] = useState(defaultThemeParams);
  const [showThemeDesigner, setShowThemeDesigner] = useState(false);

  // Load user's theme from Firestore when they log in
  useEffect(() => {
    const fetchTheme = async () => {
      if (user) {
        const themeRef = doc(db, 'users', user.uid, 'data', 'theme');
        const themeSnap = await getDoc(themeRef);
        if (themeSnap.exists()) {
          setThemeParams(themeSnap.data());
        } else {
          setThemeParams(defaultThemeParams);
        }
      } else {
        setThemeParams(defaultThemeParams);
      }
    };
    fetchTheme();
  }, [user]);

  const handleSaveTheme = async () => {
    if (user) {
      const themeRef = doc(db, 'users', user.uid, 'data', 'theme');
      await setDoc(themeRef, themeParams);
      setShowThemeDesigner(false);
      alert("Pattern Engine theme saved!");
    }
  };

  const handleRandomizeTheme = () => {
    const randomHue = () => Math.floor(Math.random() * 360);
    const randomColor = (h) => `hsl(${h}, 70%, 60%)`;
    
    const baseHue1 = randomHue();
    const baseHue2 = (baseHue1 + 120) % 360;
    const baseHue3 = (baseHue1 + 240) % 360;

    setThemeParams({
      pattern: ['cosmic-noise', 'electric-marble', 'crystal-caverns'][Math.floor(Math.random() * 3)],
      complexity: Math.random() * 15 + 2,
      speed: Math.random() * 5,
      distortion: Math.random() * 10,
      color1: randomColor(baseHue1),
      color2: randomColor(baseHue2),
      color3: randomColor(baseHue3),
    });
  };

  if (loading) return <Loader text="Loading your universe..." />;

  return (
    <Router>
      <DynamicBackground themeParams={themeParams} />
      <div className="App">
        <Navbar user={user} onThemeClick={() => setShowThemeDesigner(true)} />
        <Routes>
          <Route path="/" element={<JournalListPage user={user} />} />
          <Route path="/journal/:journalId" element={<JournalPage user={user} />} />
          <Route path="/journal/:journalId/item/:itemId" element={<ItemPage user={user} />} />
          <Route path="/tank-game" element={<TankGamePage user={user} />} />
        </Routes>
        <footer className="footer">Create your own magic!</footer>
      </div>
      {showThemeDesigner && (
        <ThemeDesigner
          themeParams={themeParams}
          setThemeParams={setThemeParams}
          onSave={handleSaveTheme}
          onClose={() => setShowThemeDesigner(false)}
          onRandomize={handleRandomizeTheme}
        />
      )}
    </Router>
  );
}

export default App;