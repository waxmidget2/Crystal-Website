// src/components/DynamicBackground.jsx

import React, { useRef, useEffect } from 'react';
import { perlinNoise } from '../utils/noise';
import { lerpColor } from '../utils/color';

const noise = perlinNoise();

// This function is like a mini-shader. It calculates the color for a single pixel.
function calculatePixelColor(x, y, time, params) {
  const { pattern, complexity, distortion, color1, color2, color3 } = params;
  
  // Normalize coordinates to a -1 to 1 range and apply complexity (zoom)
  const u = (x / 200) * complexity;
  const v = (y / 200) * complexity;

  let n = 0; // The final value that determines color

  switch (pattern) {
    case 'cosmic-noise':
      n = noise(u + time, v);
      break;
    case 'electric-marble':
      const warp = noise(u + time * 0.5, v + time * 0.3) * distortion;
      n = Math.sin(u * 0.5 + warp + time) + noise(u, v);
      break;
    case 'crystal-caverns':
      const warpX = noise(u, v + time) * distortion;
      const warpY = noise(u + time, v) * distortion;
      n = Math.abs(noise(u + warpX, v + warpY) * 5) % 1;
      break;
    default:
      n = noise(u, v);
  }

  // Normalize n to a 0-1 range
  const t = (n + 1) / 2;

  // Blend between the 3 colors based on the value of t
  if (t < 0.5) {
    return lerpColor(color1, color2, t * 2);
  } else {
    return lerpColor(color2, color3, (t - 0.5) * 2);
  }
}

export default function DynamicBackground({ themeParams }) {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    let time = 0;

    const render = () => {
      time += themeParams.speed * 0.001;
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          const [r, g, b] = calculatePixelColor(x, y, time, themeParams);
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255; // Alpha
        }
      }
      ctx.putImageData(imageData, 0, 0);
      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [themeParams]); // Rerun effect if themeParams change

  return (
    <canvas 
      ref={canvasRef} 
      width="200" 
      height="200" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        imageRendering: 'pixelated'
      }}
    />
  );
}