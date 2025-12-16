import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import shaktiImg from "@assets/Picsart_25-12-16_18-16-30-724_1765911686574.png";
import monsterImg from "@assets/Picsart_25-12-16_16-08-38-272_1765911686514.png";
import bgImg from "@assets/generated_images/seamless_indian_village_game_background.png";
import coinImg from "@assets/Picsart_25-12-16_16-27-54-748_1765911686624.png";
import treeImg from "@assets/Picsart_25-12-16_18-27-29-612_1765911686654.png";
import jumpAudioFile from "@assets/Yeeeaaaee_1765912135361.mp3";

// Game Constants
// Physics: y is height above ground (positive is up)
const GRAVITY = -0.55; // Lower gravity for floatier, "upwards" feel
const JUMP_FORCE = 16;  // Higher jump
const SPEED_INCREMENT = 0.0005;

export default function Game() {
  const [gameState, setGameState] = useState<"playing" | "hit" | "gameover">("playing");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [, setTick] = useState(0); // Force re-render for smooth animation
  
  // Refs for game loop state
  const playerRef = useRef({ y: 0, dy: 0, grounded: true });
  const obstaclesRef = useRef<{ id: number; x: number; w: number; h: number; type: 'rock' | 'bush' | 'tree' }[]>([]);
  const coinsRef = useRef<{ id: number; x: number; y: number; collected: boolean }[]>([]);
  const gameSpeedRef = useRef(7); // Start slightly faster for smoothness
  const scoreRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const bgOffsetRef = useRef(0);
  const nextIdRef = useRef(0); // Unique IDs for keys
  const jumpSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    jumpSoundRef.current = new Audio(jumpAudioFile);
  }, []);

  const handleJump = useCallback(() => {
    if (playerRef.current.grounded && gameState === "playing") {
      playerRef.current.dy = JUMP_FORCE;
      playerRef.current.grounded = false;
      
      // Play jump sound
      if (jumpSoundRef.current) {
        jumpSoundRef.current.currentTime = 0;
        jumpSoundRef.current.play().catch(e => console.log("Audio play failed", e));
      }
    }
  }, [gameState]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleJump]);

  // Game Loop
  const update = useCallback((time: number) => {
    if (gameState !== "playing") return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    
    // --- Physics ---
    const player = playerRef.current;
    
    // Gravity (pulls down, so negative)
    player.dy += GRAVITY;
    player.y += player.dy;

    // Ground collision
    if (player.y < 0) {
      player.y = 0;
      player.dy = 0;
      player.grounded = true;
    }

    // Speed increase
    gameSpeedRef.current += SPEED_INCREMENT;
    bgOffsetRef.current += gameSpeedRef.current;

    // --- Spawning ---
    if (Math.random() < 0.015) {
      const typeRand = Math.random();
      let type: 'rock' | 'bush' | 'tree' = 'rock';
      let width = 50;
      let height = 50;

      if (typeRand > 0.65) {
        type = 'tree'; // Barrier tree (Use the new image)
        width = 70; 
        height = 90; 
      } else if (typeRand > 0.35) {
        type = 'bush';
        width = 60;
        height = 50;
      }

      // Minimum distance check
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (!lastObs || lastObs.x < 800) {
         obstaclesRef.current.push({
          id: nextIdRef.current++,
          x: 1300 + Math.random() * 300, 
          w: width,
          h: height,
          type
        });
      }
    }

    if (Math.random() < 0.02) {
      coinsRef.current.push({
        id: nextIdRef.current++,
        x: 1300,
        y: Math.random() > 0.5 ? 160 : 70, // Higher coins
        collected: false
      });
    }

    // --- Updates & Collision ---
    
    // Obstacles
    obstaclesRef.current.forEach(obs => {
      obs.x -= gameSpeedRef.current;
    });
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x > -200);

    // Coins
    coinsRef.current.forEach(c => {
      c.x -= gameSpeedRef.current;
    });
    coinsRef.current = coinsRef.current.filter(c => c.x > -100);

    // Collision Detection
    // Player: x=100, y=player.y
    const playerHitbox = { 
      x: 100 + 20, // Tighter hitbox x
      y: player.y, 
      w: 30, 
      h: 60 
    };

    // Check Obstacles
    for (const obs of obstaclesRef.current) {
      // Forgive boundaries slightly
      const obsHitbox = { 
        x: obs.x + 10, 
        y: 0, 
        w: obs.w - 20, 
        h: obs.h - 10
      }; 
      
      if (
        playerHitbox.x < obsHitbox.x + obsHitbox.w &&
        playerHitbox.x + playerHitbox.w > obsHitbox.x &&
        playerHitbox.y < obsHitbox.y + obsHitbox.h &&
        playerHitbox.y + playerHitbox.h > obsHitbox.y
      ) {
        // HIT!
        setGameState("hit");
        
        // Glimpse: Freeze for 1.5 seconds then show Game Over
        setTimeout(() => {
          setGameState("gameover");
        }, 1500);
        
        return; // Stop update loop immediately
      }
    }

    // Check Coins
    coinsRef.current.forEach(c => {
      if (c.collected) return;
      const coinHitbox = { x: c.x, y: c.y, w: 40, h: 40 }; // Easier to collect coins
      
      if (
        playerHitbox.x < coinHitbox.x + coinHitbox.w &&
        playerHitbox.x + playerHitbox.w > coinHitbox.x &&
        playerHitbox.y < coinHitbox.y + coinHitbox.h &&
        playerHitbox.y + playerHitbox.h > coinHitbox.y
      ) {
        c.collected = true;
        setCoins(prev => prev + 1);
      }
    });

    // Score
    scoreRef.current += 0.15;
    setScore(Math.floor(scoreRef.current));
    
    // Force re-render
    setTick(prev => prev + 1);

    requestRef.current = requestAnimationFrame(update);
  }, [gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  // Reset Game
  const resetGame = () => {
    playerRef.current = { y: 0, dy: 0, grounded: true };
    obstaclesRef.current = [];
    coinsRef.current = [];
    gameSpeedRef.current = 7;
    scoreRef.current = 0;
    bgOffsetRef.current = 0;
    setScore(0);
    setCoins(0);
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-sky-200 relative font-sans select-none touch-none">
      {/* Background Parallax */}
      <div 
        className="absolute inset-0 h-full w-[200%] bg-repeat-x"
        style={{ 
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'auto 100%',
          transform: `translateX(-${bgOffsetRef.current % window.innerWidth}px)`,
          willChange: 'transform'
        }}
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
        <Card className="p-3 bg-white/90 backdrop-blur border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <img src={coinImg} className="w-8 h-8 rounded-full shadow-sm animate-pulse object-cover" />
            <span className="text-xl font-bold text-yellow-600 font-sans">{coins}</span>
          </div>
          <div className="h-6 w-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500 uppercase">Distance</span>
            <span className="text-xl font-bold text-slate-800 tabular-nums">{score}m</span>
          </div>
        </Card>
      </div>

      {/* Game Area Container */}
      <div className="absolute inset-x-0 bottom-0 h-[300px]">
        
        {/* Floor Line (visual) */}
        <div className="absolute bottom-0 w-full h-4 bg-transparent z-10" />

        {/* Player (Shakti) */}
        <div 
          className="absolute left-[100px] bottom-0 w-[80px] h-[100px] z-30"
          style={{ 
            transform: `translateY(${-playerRef.current.y}px)`,
            willChange: 'transform'
          }}
        >
          <img src={shaktiImg} alt="Shakti" className="w-full h-full object-contain drop-shadow-lg" />
        </div>

        {/* Monster (Chirag) - Chasing behind */}
        {/* Moved WAY further back as requested */}
        <div className="absolute left-[-150px] bottom-0 w-[140px] h-[160px] z-20 animate-bounce" style={{ animationDuration: '2.5s' }}>
          <img src={monsterImg} alt="Chirag" className="w-full h-full object-contain drop-shadow-xl opacity-90" />
        </div>

        {/* Obstacles & Coins Rendering Loop */}
        {obstaclesRef.current.map((obs) => (
          <div
            key={`obs-${obs.id}`}
            className="absolute bottom-0 z-20 flex items-end justify-center"
            style={{ 
              left: obs.x, 
              width: obs.w, 
              height: obs.h,
            }}
          >
             {obs.type === 'tree' ? (
               <img src={treeImg} alt="Tree" className="w-full h-full object-contain drop-shadow-md origin-bottom rounded-lg" />
             ) : (
               <div 
                className="w-full h-full"
                style={{
                  backgroundColor: obs.type === 'rock' ? '#5d4037' : '#2e7d32',
                  borderRadius: obs.type === 'rock' ? '40% 40% 10% 10%' : '50% 50% 0 0',
                }}
               >
                 {obs.type === 'rock' && <div className="w-full h-full bg-stone-600 rounded-t-xl border-b-4 border-stone-800" />}
                 {obs.type === 'bush' && <div className="w-full h-full bg-green-600 rounded-full border-b-4 border-green-800" />}
               </div>
             )}
          </div>
        ))}

        {coinsRef.current.map((c) => !c.collected && (
          <div
            key={`coin-${c.id}`}
            className="absolute z-20"
            style={{ 
              left: c.x, 
              bottom: c.y,
              width: 40, 
              height: 40 
            }}
          >
            <img src={coinImg} className="w-full h-full object-contain animate-[spin_3s_linear_infinite] rounded-full shadow-sm" />
          </div>
        ))}

      </div>

      {/* Touch Controls Overlay */}
      <div 
        className="absolute inset-0 z-40 cursor-pointer" 
        onClick={handleJump}
        onTouchStart={handleJump}
      />

      {/* Hit / Glimpse Overlay (optional visual cue) */}
      {gameState === "hit" && (
         <div className="absolute inset-0 z-50 bg-red-500/20 animate-pulse pointer-events-none" />
      )}

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState === "gameover" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <h2 className="text-4xl font-black text-destructive mb-2 font-sans">OH NO!</h2>
              <p className="text-xl text-slate-600 mb-6 font-medium">Chirag caught you!</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-100">
                  <div className="text-sm text-orange-400 font-bold uppercase">Distance</div>
                  <div className="text-2xl font-black text-orange-600">{score}m</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-100">
                  <div className="text-sm text-yellow-500 font-bold uppercase">Coins</div>
                  <div className="text-2xl font-black text-yellow-600">{coins}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  onClick={resetGame}
                  className="w-full text-xl h-14 font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all bg-primary hover:bg-primary/90"
                >
                  TRY AGAIN
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Return Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
