// src/components/TankGame.jsx

import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TANK_SIZE = 20;
const BULLET_SPEED = 5;
const TANK_SPEED = 2;
const ROTATION_SPEED = 0.05;

// The one and only game document in Firestore
const gameRef = doc(db, 'global', 'tankGame');

export default function TankGame({ user }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isPlayer, setIsPlayer] = useState(false);
  const [playerNumber, setPlayerNumber] = useState(null);

  // Listen for real-time game state changes from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameState(data);
        // Check if the current user is one of the players
        if (user) {
          if (data.player1?.id === user.uid) {
            setIsPlayer(true);
            setPlayerNumber(1);
          } else if (data.player2?.id === user.uid) {
            setIsPlayer(true);
            setPlayerNumber(2);
          } else {
            setIsPlayer(false);
            setPlayerNumber(null);
          }
        }
      } else {
        // If the game document doesn't exist, create it
        initializeGame();
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Main game loop for drawing on the canvas
  useEffect(() => {
    if (!gameState || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player 1
    if (gameState.player1) {
      drawTank(ctx, gameState.player1, '#8be9fd'); // Cyan
    }
    // Draw Player 2
    if (gameState.player2) {
      drawTank(ctx, gameState.player2, '#ff79c6'); // Pink
    }
    // Draw bullets
    gameState.bullets?.forEach(bullet => drawBullet(ctx, bullet));

  }, [gameState]);

  // Keyboard controls for players
  useEffect(() => {
    if (!isPlayer) return;

    const handleKeyDown = (e) => {
      updatePlayerMovement(e.key, true);
    };
    const handleKeyUp = (e) => {
      updatePlayerMovement(e.key, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlayer, playerNumber]);

  // Game logic update loop (runs every ~50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlayer && gameState?.status === 'active') {
        updateGameLogic();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlayer, gameState]);


  // --- Helper Functions ---

  const drawTank = (ctx, player, color) => {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    // Tank body
    ctx.fillStyle = color;
    ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
    // Tank turret
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -4, 4, -TANK_SIZE / 2);
    ctx.restore();
  };

  const drawBullet = (ctx, bullet) => {
    ctx.fillStyle = '#f1fa8c'; // Yellow
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, 2 * Math.PI);
    ctx.fill();
  };
  
  const initializeGame = async () => {
    await setDoc(gameRef, {
        status: 'waiting', // waiting, active, finished
        player1: null,
        player2: null,
        bullets: [],
    });
  };

  const joinGame = async () => {
    if (!user) return alert('You must be signed in to play!');
    const docSnap = await getDoc(gameRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const newPlayer = { id: user.uid, x: 50, y: 150, angle: 0, score: 0, controls: {} };
    
    let updatePayload = {};
    if (!data.player1) {
      updatePayload.player1 = newPlayer;
    } else if (!data.player2 && data.player1.id !== user.uid) {
      newPlayer.x = 350; // Start on the other side
      updatePayload.player2 = newPlayer;
      updatePayload.status = 'active'; // Start the game!
    } else {
      alert("Game is full!");
      return;
    }
    await updateDoc(gameRef, updatePayload);
  };
  
  const resetGame = async () => {
    if (window.confirm("Are you sure you want to reset the game for everyone?")) {
        initializeGame();
    }
  };

  const updatePlayerMovement = (key, isPressed) => {
    let control = null;
    switch (key) {
      case 'w': case 'ArrowUp': control = 'forward'; break;
      case 's': case 'ArrowDown': control = 'backward'; break;
      case 'a': case 'ArrowLeft': control = 'left'; break;
      case 'd': case 'ArrowRight': control = 'right'; break;
      case ' ': control = 'fire'; break;
      default: return;
    }
    const update = {};
    update[`player${playerNumber}.controls.${control}`] = isPressed;
    updateDoc(gameRef, update);
  };
  
  const updateGameLogic = async () => {
    const docSnap = await getDoc(gameRef);
    if (!docSnap.exists()) return;
    const currentState = docSnap.data();
    
    let p1 = { ...currentState.player1 };
    let p2 = { ...currentState.player2 };
    let bullets = [...currentState.bullets];
    
    // Update player positions
    [p1, p2].forEach(p => {
        if (!p) return;
        if (p.controls?.forward) {
            p.x += Math.sin(p.angle) * TANK_SPEED;
            p.y -= Math.cos(p.angle) * TANK_SPEED;
        }
        if (p.controls?.backward) {
            p.x -= Math.sin(p.angle) * TANK_SPEED;
            p.y += Math.cos(p.angle) * TANK_SPEED;
        }
        if (p.controls?.left) p.angle -= ROTATION_SPEED;
        if (p.controls?.right) p.angle += ROTATION_SPEED;
    });
    
    // Update bullets and handle firing
    bullets = bullets.map(b => ({
        ...b,
        x: b.x + Math.sin(b.angle) * BULLET_SPEED,
        y: b.y - Math.cos(b.angle) * BULLET_SPEED,
    })).filter(b => b.x > 0 && b.x < 400 && b.y > 0 && b.y < 300); // Remove off-screen bullets

    [p1, p2].forEach((p, index) => {
        if (p?.controls?.fire) {
            bullets.push({ x: p.x, y: p.y, angle: p.angle, owner: index + 1 });
            p.controls.fire = false; // Prevent continuous fire
        }
    });

    // Simple collision detection
    // (This part is complex in a real game, this is a simplified version)

    // Update Firestore with the new state
    await updateDoc(gameRef, { player1: p1, player2: p2, bullets: bullets });
  };


  if (!gameState) {
    return null; // Don't render anything if game state isn't loaded
  }

  return (
    <div className="tank-game-container glass-ui">
      <canvas ref={canvasRef} width="400" height="300" className="tank-game-canvas"></canvas>
      <div className="tank-game-controls">
        {gameState.status === 'waiting' && (
            <button className="action-button secondary" onClick={joinGame}>Join Game</button>
        )}
        {gameState.status === 'active' && !isPlayer && <p>Spectating Game</p>}
        {gameState.status === 'active' && isPlayer && <p>You are Player {playerNumber}! (Use WASD/Arrows + Space)</p>}
        <button className="action-button primary" onClick={resetGame} style={{marginLeft: '10px'}}>Reset</button>
      </div>
    </div>
  );
}