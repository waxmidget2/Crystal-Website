// src/pages/CrystalPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { debounce } from 'lodash';
import Loader from '../components/Loader';

export default function CrystalPage() {
  const { crystalId } = useParams();
  const [user] = useAuthState(auth);
  const [crystal, setCrystal] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 20% Cooler Easter Egg ---
  // useMemo will only recalculate when the 'note' changes
  const isCooler = useMemo(() => {
    return note.toLowerCase().includes('20% cooler');
  }, [note]);

  const debouncedSave = useCallback(
    debounce(async (newNote) => {
      if (user && crystal) {
        const noteRef = doc(db, 'users', user.uid, 'notes', crystal.id);
        await setDoc(noteRef, { content: newNote, lastUpdated: serverTimestamp() }, { merge: true });
      }
    }, 1000),
    [user, crystal]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const crystalRef = doc(db, 'crystals', crystalId);
        const crystalSnap = await getDoc(crystalRef);
        if (crystalSnap.exists()) {
          setCrystal({ id: crystalSnap.id, ...crystalSnap.data() });
        }
        if (user) {
          const noteRef = doc(db, 'users', user.uid, 'notes', crystalId);
          const noteSnap = await getDoc(noteRef);
          if (noteSnap.exists()) {
            setNote(noteSnap.data().content);
          } else {
            setNote('');
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [crystalId, user]);

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    debouncedSave(e.target.value);
  };

  if (loading) return <Loader />;
  if (!crystal) return <div><h2>Crystal not found.</h2><Link to="/">Go Home</Link></div>;

  return (
    <div className="crystal-page-container">
      <Link to="/" className="back-button glass-ui">← Back to All Crystals</Link>
      <div className="crystal-page-layout">
        <aside className="crystal-summary-sidebar glass-ui">
          <img src={crystal.image} alt={crystal.name} className="summary-image" style={{ borderColor: crystal.color }} onError={(e) => { e.target.src='https://placehold.co/200/1a1a2e/f0f0f0?text=Crystal'; }} />
          <h1 className="summary-title" style={{ color: crystal.color }}>{crystal.name}</h1>
          <p className="summary-text">{crystal.summary}</p>
        </aside>
        <main className="journal-area glass-ui">
          {user ? (
            <textarea
              // Apply the special class if the easter egg is found!
              className={`journal-textarea ${isCooler ? 'twenty-percent-cooler' : ''}`}
              value={note}
              onChange={handleNoteChange}
              placeholder={`My personal thoughts & feelings about ${crystal.name}...`}
            />
          ) : (
            <div className="journal-login-prompt">
              <h2>Sign in to keep a journal.</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}