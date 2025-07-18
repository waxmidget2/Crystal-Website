// src/pages/JournalListPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import Loader from '../components/Loader';

export default function JournalListPage({ user }) {
  const [journals, setJournals] = useState([]);
  const [newJournalName, setNewJournalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

  useEffect(() => {
    if (user) {
      const fetchJournals = async () => {
        setLoading(true);
        const journalsRef = collection(db, 'users', user.uid, 'journals');
        const q = query(journalsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const userJournals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJournals(userJournals);
        setLoading(false);
      };
      fetchJournals();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    if (!newJournalName.trim() || !user) return;

    const journalsRef = collection(db, 'users', user.uid, 'journals');
    const newJournalDoc = await addDoc(journalsRef, {
      name: newJournalName,
      createdAt: serverTimestamp(),
    });

    setJournals(prev => [{ id: newJournalDoc.id, name: newJournalName, createdAt: new Date() }, ...prev]);
    setNewJournalName('');
  };

  // --- NEW: Function to delete an entire journal and its contents ---
  const handleDeleteJournal = async (journalId) => {
    if (!user || !window.confirm(`Are you sure you want to permanently delete this journal and all its items? This cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);

    try {
      const itemsRef = collection(db, 'users', user.uid, 'journals', journalId, 'items');
      const itemsSnapshot = await getDocs(itemsRef);
      const firestoreBatch = writeBatch(db);

      // 1. Delete all associated images from Storage
      for (const itemDoc of itemsSnapshot.docs) {
        const imageUrl = itemDoc.data().image;
        if (imageUrl) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef).catch(err => console.warn("Image delete failed, may not exist:", err));
        }
        // Add the item document deletion to the batch
        firestoreBatch.delete(itemDoc.ref);
      }

      // 2. Delete the main journal document
      const journalRef = doc(db, 'users', user.uid, 'journals', journalId);
      firestoreBatch.delete(journalRef);
      
      // 3. Commit all Firestore deletions at once
      await firestoreBatch.commit();

      // 4. Update the UI state
      setJournals(prev => prev.filter(j => j.id !== journalId));

    } catch (error) {
      console.error("Error deleting journal:", error);
      alert("Failed to delete journal. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <Loader text="Finding your journals..." />;
  }
  
  if (isDeleting) {
      return <Loader text="Deleting journal..." />;
  }

  if (!user) {
    return (
      <div className="login-prompt">
        <h2>Welcome to your Multi-Journal!</h2>
        <p>Please sign in to create and view your journals.</p>
      </div>
    );
  }

  return (
    <div className="journal-list-container">
      <h1>Your Journals</h1>
      <form onSubmit={handleCreateJournal} className="add-journal-form glass-ui">
        <input
          type="text"
          value={newJournalName}
          onChange={(e) => setNewJournalName(e.target.value)}
          placeholder="New journal name (e.g., Tarot Cards)"
        />
        <button type="submit" className="action-button secondary">＋ Create</button>
      </form>

      <div className="journal-grid">
        {journals.map(journal => (
          <div key={journal.id} className="journal-card glass-ui">
            {/* --- NEW: Delete button for journals --- */}
            <button
              className="delete-button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteJournal(journal.id); }}
              title="Delete Journal"
            >
              &times;
            </button>
            <Link to={`/journal/${journal.id}`} className="journal-card-link">
              <h2>{journal.name}</h2>
            </Link>
          </div>
        ))}
        {journals.length === 0 && <p>You haven't created any journals yet. Add one above to get started!</p>}
      </div>
    </div>
  );
}