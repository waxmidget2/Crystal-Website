// src/pages/TankGamePage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, addDoc, getDocs, doc, onSnapshot, 
  updateDoc, arrayUnion, deleteDoc, serverTimestamp, 
  writeBatch, setDoc, query, where, Timestamp 
} from 'firebase/firestore';
import { debounce } from 'lodash';
import Loader from '../components/Loader'; // <-- THE MISSING IMPORT IS NOW ADDED

// --- Main Game Component ---
export default function TankGamePage({ user }) {
  const [currentGameId, setCurrentGameId] = useState(null);

  if (!user) {
    return <div className="login-prompt"><h2>Please sign in to play the Tank Game!</h2></div>;
  }

  if (!currentGameId) {
    return <GameLobby user={user} onJoinGame={setCurrentGameId} />;
  }

  return <GameCanvas user={user} gameId={currentGameId} onExitGame={() => setCurrentGameId(null)} />;
}


// --- Game Lobby Component ---
function GameLobby({ user, onJoinGame }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lobbyRef = collection(db, 'tank-game-lobby');
    
    const cleanupOldGames = async () => {
        const oneHourAgo = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
        const oldGamesQuery = query(lobbyRef, where("createdAt", "<", oneHourAgo));
        const oldGamesSnapshot = await getDocs(oldGamesQuery);
        const batch = writeBatch(db);
        oldGamesSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    };
    
    cleanupOldGames();

    const unsubscribe = onSnapshot(lobbyRef, (snapshot) => {
      const availableGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGames(availableGames);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCreateGame = async () => {
    setLoading(true);
    const lobbyRef = collection(db, 'tank-game-lobby');
    const newLobbyGame = await addDoc(lobbyRef, {
      creatorId: user.uid,
      creatorName: user.displayName || "Anonymous",
      createdAt: serverTimestamp()
    });
    
    const gameRef = doc(db, 'tank-games', newLobbyGame.id);
    await setDoc(gameRef, {
      players: [user.uid],
      playerStates: {
        [user.uid]: { x: 100, y: 100, angle: 0, score: 0, color: '#8be9fd', name: user.displayName || "Player 1" }
      },
      bullets: [],
      gameState: 'waiting'
    });
    
    onJoinGame(newLobbyGame.id);
  };

  const handleJoinGame = async (game) => {
    const gameRef = doc(db, 'tank-games', game.id);
    await updateDoc(gameRef, {
      players: arrayUnion(user.uid),
      [`playerStates.${user.uid}`]: { x: 700, y: 500, angle: Math.PI, score: 0, color: '#ff79c6', name: user.displayName || "Player 2" },
      gameState: 'active'
    });
    
    await deleteDoc(doc(db, 'tank-game-lobby', game.id));
    onJoinGame(game.id);
  };

  // --- FIX: Use the actual Loader component ---
  if (loading) return <Loader text="Entering Lobby..." />;

  return (
    <div className="journal-list-container">
      <h1>Tank Game Lobby</h1>
      <button onClick={handleCreateGame} className="action-button secondary">Create New Game</button>
      <div className="journal-grid" style={{marginTop: '20px'}}>
        {games.length > 0 ? games.map(game => (
          <div key={game.id} className="journal-card glass-ui">
            <h2>{game.creatorName}'s Game</h2>
            <p>Waiting for a player...</p>
            <button onClick={() => handleJoinGame(game)} className="action-button primary">Join Game</button>
          </div>
        )) : <p>No available games. Create one!</p>}
      </div>
    </div>
  );
}

// --- Game Canvas and Logic Component ---
function GameCanvas({ user, gameId, onExitGame }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const keyStates = useRef({}).current;

  const updatePlayerInFirestore = useCallback(debounce((playerState) => {
    const gameRef = doc(db, 'tank-games', gameId);
    updateDoc(gameRef, {
      [`playerStates.${user.uid}`]: playerState
    }).catch(err => console.error("Error updating player state:", err));
  }, 50), [gameId, user.uid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const gameLoop = () => {
      if (!gameStateRef.current) {
        requestAnimationFrame(gameLoop);
        return;
      }
      
      const { playerStates = {}, bullets = [] } = gameStateRef.current;
      const myPlayerState = playerStates[user.uid];

      if (myPlayerState) {
        let dx = 0;
        let dy = 0;
        if (keyStates['ArrowUp'] || keyStates['KeyW']) dy = -3;
        if (keyStates['ArrowDown'] || keyStates['KeyS']) dy = 3;
        if (keyStates['ArrowLeft'] || keyStates['KeyA']) dx = -3;
        if (keyStates['ArrowRight'] || keyStates['KeyD']) dx = 3;
        
        if(dx !== 0 || dy !== 0) {
            const newX = Math.max(20, Math.min(canvas.width - 20, myPlayerState.x + dx));
            const newY = Math.max(20, Math.min(canvas.height - 20, myPlayerState.y + dy));
            const newAngle = Math.atan2(dy, dx) + Math.PI / 2;
            
            const updatedState = { ...myPlayerState, x: newX, y: newY, angle: newAngle };
            gameStateRef.current.playerStates[user.uid] = updatedState;
            updatePlayerInFirestore(updatedState);
        }
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      Object.values(playerStates).forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-15, -20, 30, 40);
        ctx.fillRect(-3, -30, 6, 20);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, 0, -35);
        ctx.restore();
      });

      const updatedBullets = [];
      const batch = writeBatch(db);
      let scoreChanged = false;

      bullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        let hit = false;
        
        Object.entries(playerStates).forEach(([uid, p]) => {
          if (uid !== b.ownerId) {
            const distance = Math.sqrt((b.x - p.x)**2 + (b.y - p.y)**2);
            if (distance < 20) {
              hit = true;
              const shooterState = gameStateRef.current.playerStates[b.ownerId];
              if (shooterState) {
                shooterState.score += 1;
                scoreChanged = true;
              }
            }
          }
        });

        if (!hit && b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height) {
          updatedBullets.push(b);
        }
      });
      
      const gameRef = doc(db, 'tank-games', gameId);
      if (scoreChanged) {
        batch.update(gameRef, { bullets: updatedBullets, playerStates: gameStateRef.current.playerStates });
      } else {
        batch.update(gameRef, { bullets: updatedBullets });
      }
      batch.commit();

      updatedBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
      });

      requestAnimationFrame(gameLoop);
    };

    const gameRef = doc(db, 'tank-games', gameId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        gameStateRef.current = doc.data();
      } else {
        alert("Game has ended.");
        onExitGame();
      }
    });

    const handleKeyDown = (e) => {
      keyStates[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        const myPlayerState = gameStateRef.current?.playerStates?.[user.uid];
        if (myPlayerState) {
          const gameRef = doc(db, 'tank-games', gameId);
          updateDoc(gameRef, {
            bullets: arrayUnion({
              ownerId: user.uid,
              x: myPlayerState.x,
              y: myPlayerState.y,
              vx: Math.sin(myPlayerState.angle) * 5,
              vy: -Math.cos(myPlayerState.angle) * 5,
            })
          });
        }
      }
    };
    const handleKeyUp = (e) => keyStates[e.code] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    gameLoop();

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameId, user.uid, onExitGame, updatePlayerInFirestore]);

  const scores = gameStateRef.current?.playerStates ? 
    Object.values(gameStateRef.current.playerStates)
        .map(p => `${p.name}: ${p.score}`)
        .join(' | ') 
    : 'Loading...';

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h1>Tank Battle!</h1>
      <p><strong>Controls:</strong> WASD/Arrows to Move | Space to Fire</p>
      <p><strong>Score:</strong> {scores}</p>
      <canvas 
        ref={canvasRef} 
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '15px', border: '2px solid var(--glass-border)' }}
      />
      <button onClick={onExitGame} className="action-button primary" style={{marginTop: '20px'}}>Exit Game</button>
    </div>
  );
}
