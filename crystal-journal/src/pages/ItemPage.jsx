// src/pages/ItemPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { debounce } from 'lodash';
import Loader from '../components/Loader';

export default function ItemPage({ user }) {
  const { journalId, itemId } = useParams();
  const [item, setItem] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const debouncedSave = useCallback(
    debounce(async (newNote) => {
      if (user && journalId && itemId) {
        const noteRef = doc(db, 'users', user.uid, 'journals', journalId, 'notes', itemId);
        await setDoc(noteRef, { content: newNote, lastUpdated: serverTimestamp() }, { merge: true });
      }
    }, 1000),
    [user, journalId, itemId]
  );

  useEffect(() => {
    if (user && journalId && itemId) {
      const fetchData = async () => {
        setLoading(true);
        // Fetch item data
        const itemRef = doc(db, 'users', user.uid, 'journals', journalId, 'items', itemId);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) setItem({ id: itemSnap.id, ...itemSnap.data() });

        // Fetch note data
        const noteRef = doc(db, 'users', user.uid, 'journals', journalId, 'notes', itemId);
        const noteSnap = await getDoc(noteRef);
        if (noteSnap.exists()) setNote(noteSnap.data().content);
        
        setLoading(false);
      };
      fetchData();
    }
  }, [user, journalId, itemId]);

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    debouncedSave(e.target.value);
  };

  if (loading) return <Loader />;
  if (!item) return <div><h2>Item not found.</h2><Link to={`/journal/${journalId}`}>Back to Journal</Link></div>;

  return (
    <div className="crystal-page-container">
      <Link to={`/journal/${journalId}`} className="back-button glass-ui">← Back to Journal</Link>
      <div className="crystal-page-layout">
        <aside className="crystal-summary-sidebar glass-ui">
          <img src={item.image} alt={item.name} className="summary-image" style={{ borderColor: item.color || '#fff' }} />
          <h1 className="summary-title" style={{ color: item.color || '#fff' }}>{item.name}</h1>
          <p className="summary-text">{item.summary}</p>
        </aside>
        <main className="journal-area glass-ui">
          <textarea
            className="journal-textarea"
            value={note}
            onChange={handleNoteChange}
            placeholder={`My personal thoughts & feelings about ${item.name}...`}
          />
        </main>
      </div>
    </div>
  );
}