import React from 'react';

// A reusable loader component
export default function Loader({ text = "Summoning Crystals..." }) {
  return (
    <div className="loader-container">
      <div className="loader-crystal">💎</div>
      <p>{text}</p>
    </div>
  );
}