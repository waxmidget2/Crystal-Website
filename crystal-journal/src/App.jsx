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
import ThemeDesigner from './components/ThemeDesigner';
import TankGamePage from './pages/TankGamePage';

const defaultTheme = {
  bgColor: '#2c2a4a',
  primaryAccent: '#ff79c6',
  secondaryAccent: '#8be9fd',
  fontColor: '#f8f8f2',
  fontColorMuted: '#bd93f9',
};

function App() {
  const [user, loading] = useAuthState(auth);
  const [theme, setTheme] = useState(defaultTheme);
  const [showThemeDesigner, setShowThemeDesigner] = useState(false);

  useEffect(() => {
    const fetchTheme = async () => {
      if (user) {
        const themeRef = doc(db, 'users', user.uid, 'data', 'theme');
        const themeSnap = await getDoc(themeRef);
        if (themeSnap.exists()) setTheme(themeSnap.data());
        else setTheme(defaultTheme);
      }
    };
    fetchTheme();
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.bgColor);
    root.style.setProperty('--primary-accent', theme.primaryAccent);
    root.style.setProperty('--secondary-accent', theme.secondaryAccent);
    root.style.setProperty('--font-color', theme.fontColor);
    root.style.setProperty('--font-color-muted', theme.fontColorMuted);
  }, [theme]);

  const handleSaveTheme = async () => {
    if (user) {
      const themeRef = doc(db, 'users', user.uid, 'data', 'theme');
      await setDoc(themeRef, theme, { merge: true });
      setShowThemeDesigner(false);
      alert("Theme saved!");
    }
  };

  if (loading) return <Loader text="Loading your universe..." />;

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onThemeClick={() => setShowThemeDesigner(true)} />
        <Routes>
          <Route path="/" element={<JournalListPage user={user} />} />
          <Route path="/journal/:journalId" element={<JournalPage user={user} />} />
          <Route path="/journal/:journalId/item/:itemId" element={<ItemPage user={user} />} />
          {/* Pass the user object to the game page */}
          <Route path="/tank-game" element={<TankGamePage user={user} />} />
        </Routes>
        <footer className="footer">Create your own magic!</footer>
      </div>
      {showThemeDesigner && (
        <ThemeDesigner
          theme={theme}
          setTheme={setTheme}
          onSave={handleSaveTheme}
          onClose={() => setShowThemeDesigner(false)}
        />
      )}
    </Router>
  );
}

export default App;