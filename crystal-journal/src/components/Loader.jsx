import React from 'react';
import { PulseLoader } from 'react-spinners';

export default function Loader() {
  return (
    <div className="loader-container">
      <PulseLoader color="#e94560" size={20} />
    </div>
  );
}