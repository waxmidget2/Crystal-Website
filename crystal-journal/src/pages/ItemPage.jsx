// src/pages/ItemPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { debounce } from 'lodash';
import Loader from '../components/Loader';

export default function ItemPage({ user }) {
  const { journalId, itemId } = useParams();
  const [item, setItem] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  // --- NEW STATE FOR EDITING SUMMARY ---
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editableSummary, setEditableSummary] = useState('');

  const debouncedSaveNote = useCallback(
    debounce(async (newNote) => {
      if (user && journalId && itemId) {
        const noteRef = doc(db, 'users', user.uid, 'journals', journalId, 'notes', itemId);
        await setDoc(noteRef, { content: newNote }, { merge: true });
      }
    }, 1000),
    [user, journalId, itemId]
  );

  useEffect(() => {
    if (user && journalId && itemId) {
      const fetchData = async () => {
        setLoading(true);
        const itemRef = doc(db, 'users', user.uid, 'journals', journalId, 'items', itemId);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          const itemData = { id: itemSnap.id, ...itemSnap.data() };
          setItem(itemData);
          setEditableSummary(itemData.summary); // Initialize editable summary
        }

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
    debouncedSaveNote(e.target.value);
  };

  // --- NEW FUNCTION TO SAVE THE EDITED SUMMARY ---
  const handleSummarySave = async () => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'journals', journalId, 'items', itemId);
    await updateDoc(itemRef, {
      summary: editableSummary
    });
    // Update local state to match
    setItem(prevItem => ({ ...prevItem, summary: editableSummary }));
    setIsEditingSummary(false); // Exit editing mode
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
          
          {/* --- EDITABLE SUMMARY LOGIC --- */}
          {isEditingSummary ? (
            <div>
              <textarea
                className="summary-textarea"
                value={editableSummary}
                onChange={(e) => setEditableSummary(e.target.value)}
              />
              <button className="action-button secondary" onClick={handleSummarySave} style={{marginTop: '10px'}}>
                Save Description
              </button>
            </div>
          ) : (
            <p className="summary-text summary-text-editable" onClick={() => setIsEditingSummary(true)} title="Click to edit description">
              {item.summary}
            </p>
          )}
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