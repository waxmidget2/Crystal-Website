// src/pages/JournalListPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';

export default function JournalListPage({ user }) {
  const [journals, setJournals] = useState([]);
  const [newJournalName, setNewJournalName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchJournals = async () => {
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
    if (!newJournalName.trim()) return;

    const journalsRef = collection(db, 'users', user.uid, 'journals');
    const newJournalDoc = await addDoc(journalsRef, {
      name: newJournalName,
      createdAt: serverTimestamp(),
    });

    setJournals(prev => [{ id: newJournalDoc.id, name: newJournalName }, ...prev]);
    setNewJournalName('');
  };

  if (loading) {
    return <Loader text="Finding your journals..." />;
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
          <Link key={journal.id} to={`/journal/${journal.id}`} className="journal-card glass-ui">
            <h2>{journal.name}</h2>
          </Link>
        ))}
        {journals.length === 0 && <p>You haven't created any journals yet. Add one above to get started!</p>}
      </div>
    </div>
  );
}