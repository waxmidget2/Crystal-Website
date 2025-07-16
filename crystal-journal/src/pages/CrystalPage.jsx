import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Loader from '../components/Loader';
import { debounce } from 'lodash';

export default function CrystalPage() {
  const { crystalId } = useParams();
  const [user] = useAuthState(auth);
  const [crystal, setCrystal] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  // Debounced save function to avoid too many Firestore writes
  const debouncedSave = useCallback(
    debounce(async (newNote) => {
      if (user) {
        const noteRef = doc(db, 'users', user.uid, 'notes', crystalId);
        await setDoc(noteRef, { content: newNote, lastUpdated: serverTimestamp() }, { merge: true });
      }
    }, 1000), // Save 1 second after user stops typing
    [user, crystalId]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch crystal summary
      const crystalRef = doc(db, 'crystals', crystalId);
      const crystalSnap = await getDoc(crystalRef);
      if (crystalSnap.exists()) {
        setCrystal(crystalSnap.data());
      }

      // Fetch user's note for this crystal
      if (user) {
        const noteRef = doc(db, 'users', user.uid, 'notes', crystalId);
        const noteSnap = await getDoc(noteRef);
        if (noteSnap.exists()) {
          setNote(noteSnap.data().content);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [crystalId, user]);

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    debouncedSave(e.target.value);
  };
  
  // You need to install lodash for debounce: npm install lodash

  if (loading) return <Loader />;
  if (!crystal) return <div>Crystal not found. <Link to="/">Go Home</Link></div>;

  return (
    <>
      <Link to="/" className="back-button">← Back to All Crystals</Link>
      <div className="crystal-page-layout">
        <aside className="crystal-summary-sidebar">
          <img src={crystal.image} alt={crystal.name} className="summary-image" style={{ borderColor: crystal.color }} />
          <h1 className="summary-title" style={{ color: crystal.color }}>{crystal.name}</h1>
          <p className="summary-text">{crystal.summary}</p>
        </aside>
        <main className="journal-area">
          {user ? (
            <textarea
              className="journal-textarea"
              value={note}
              onChange={handleNoteChange}
              placeholder={`My personal thoughts & feelings about ${crystal.name}...`}
              style={{ '::placeholder': { color: '#ffffff50' } }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <h2>Please sign in to keep a journal.</h2>
            </div>
          )}
        </main>
      </div>
    </>
  );
}