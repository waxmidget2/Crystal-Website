import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';

export default function HomePage() {
  const [crystals, setCrystals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrystals = async () => {
      const querySnapshot = await getDocs(collection(db, "crystals"));
      const crystalsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCrystals(crystalsData);
      setLoading(false);
    };

    fetchCrystals();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="home-grid">
      {crystals.map(crystal => (
        <Link to={`/crystal/${crystal.id}`} key={crystal.id} className="crystal-button">
          <img src={crystal.image} alt={crystal.name} />
          <div className="crystal-button-label" style={{ backgroundColor: `${crystal.color}80` }}>
            {crystal.name}
          </div>
        </Link>
      ))}
    </div>
  );
}