import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import shaktiImg from "@assets/generated_images/cartoon_indian_boy_running_side_view.png";
import monsterImg from "@assets/generated_images/cartoon_funny_monster_chasing_side_view.png";
import bgImg from "@assets/generated_images/seamless_indian_village_game_background.png";
import coinImg from "@assets/generated_images/shiny_gold_game_coin.png";

// Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const SPEED_INCREMENT = 0.001;
const OBSTACLE_SPAWN_RATE = 2000; // ms
const COIN_SPAWN_RATE = 1500; // ms

export default function Game() {
  const [gameState, setGameState] = useState<"playing" | "gameover">("playing");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  
  // Refs for game loop state (to avoid re-renders)
  const playerRef = useRef({ y: 0, dy: 0, grounded: true });
  const obstaclesRef = useRef<{ x: number; w: number; h: number; type: 'rock' | 'bush' }[]>([]);
  const coinsRef = useRef<{ x: number; y: number; collected: boolean }[]>([]);
  const gameSpeedRef = useRef(5);
  const scoreRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const bgOffsetRef = useRef(0);

  // Audio refs (mock for now, or we could generate sounds)
  
  const handleJump = useCallback(() => {
    if (playerRef.current.grounded && gameState === "playing") {
      playerRef.current.dy = JUMP_FORCE;
      playerRef.current.grounded = false;
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
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // --- Physics ---
    const player = playerRef.current;
    
    // Gravity
    player.dy += GRAVITY;
    player.y += player.dy;

    // Ground collision
    if (player.y > 0) {
      player.y = 0;
      player.dy = 0;
      player.grounded = true;
    }

    // Speed increase
    gameSpeedRef.current += SPEED_INCREMENT;
    bgOffsetRef.current += gameSpeedRef.current;

    // --- Spawning ---
    // Simple random spawning logic based on distance/frames would be better, 
    // but for this mockup, we'll just check probabilities per frame or use intervals
    if (Math.random() < 0.015) {
      obstaclesRef.current.push({
        x: 1000, // Start off screen
        w: 50,
        h: 50,
        type: Math.random() > 0.5 ? 'rock' : 'bush'
      });
    }

    if (Math.random() < 0.02) {
      coinsRef.current.push({
        x: 1000,
        y: Math.random() > 0.5 ? -100 : -50, // High or low coin
        collected: false
      });
    }

    // --- Updates & Collision ---
    
    // Obstacles
    obstaclesRef.current.forEach(obs => {
      obs.x -= gameSpeedRef.current;
    });
    // Remove off-screen
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x > -100);

    // Coins
    coinsRef.current.forEach(c => {
      c.x -= gameSpeedRef.current;
    });
    coinsRef.current = coinsRef.current.filter(c => c.x > -100);

    // Collision Detection (Hitbox)
    // Player roughly: x=50, y=player.y (from bottom), w=60, h=80
    const playerHitbox = { x: 50, y: 300 - player.y - 80, w: 40, h: 60 }; // simplified

    // Check Obstacles
    for (const obs of obstaclesRef.current) {
      const obsHitbox = { x: obs.x, y: 300 - obs.h, w: obs.w, h: obs.h }; // Ground obstacles
      
      if (
        playerHitbox.x < obsHitbox.x + obsHitbox.w &&
        playerHitbox.x + playerHitbox.w > obsHitbox.x &&
        playerHitbox.y < obsHitbox.y + obsHitbox.h &&
        playerHitbox.y + playerHitbox.h > obsHitbox.y
      ) {
        setGameState("gameover");
      }
    }

    // Check Coins
    coinsRef.current.forEach(c => {
      if (c.collected) return;
      const coinHitbox = { x: c.x, y: 300 + c.y, w: 30, h: 30 };
      
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
    scoreRef.current += 0.1;
    setScore(Math.floor(scoreRef.current));

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
    gameSpeedRef.current = 5;
    scoreRef.current = 0;
    bgOffsetRef.current = 0;
    setScore(0);
    setCoins(0);
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-sky-200 relative font-sans select-none">
      {/* Background Parallax */}
      <div 
        className="absolute inset-0 h-full w-[200%] bg-repeat-x"
        style={{ 
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'auto 100%',
          transform: `translateX(-${bgOffsetRef.current % window.innerWidth}px)`,
          transition: 'transform 0s linear' // managed by loop
        }}
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
        <Card className="p-3 bg-white/90 backdrop-blur border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <img src={coinImg} className="w-6 h-6 animate-pulse" />
            <span className="text-xl font-bold text-yellow-600 font-sans">{coins}</span>
          </div>
          <div className="h-6 w-[2px] bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500 uppercase">Distance</span>
            <span className="text-xl font-bold text-slate-800 tabular-nums">{score}m</span>
          </div>
        </Card>
      </div>

      {/* Game Area Container (for positioning elements relative to a "floor") */}
      <div className="absolute inset-x-0 bottom-0 h-[300px]">
        
        {/* Floor Line (visual) */}
        <div className="absolute bottom-0 w-full h-4 bg-transparent z-10" />

        {/* Player (Shakti) */}
        <div 
          className="absolute left-[50px] bottom-0 w-[60px] h-[80px] z-20 transition-transform duration-75"
          style={{ 
            transform: `translateY(${-playerRef.current.y}px)`,
          }}
        >
          <img src={shaktiImg} alt="Shakti" className="w-full h-full object-contain drop-shadow-lg" />
        </div>

        {/* Monster (Chirag) - Chasing behind */}
        <div className="absolute left-[-20px] bottom-0 w-[80px] h-[90px] z-20 animate-bounce" style={{ animationDuration: '2s' }}>
          <img src={monsterImg} alt="Chirag" className="w-full h-full object-contain drop-shadow-xl" />
        </div>

        {/* Obstacles & Coins Rendering Loop */}
        {obstaclesRef.current.map((obs, i) => (
          <div
            key={`obs-${i}`}
            className="absolute bottom-0 z-10 flex items-end justify-center"
            style={{ 
              left: obs.x, 
              width: obs.w, 
              height: obs.h,
              backgroundColor: obs.type === 'rock' ? '#5d4037' : '#2e7d32', // Fallback
              borderRadius: obs.type === 'rock' ? '40% 40% 10% 10%' : '50% 50% 0 0',
            }}
          >
             {/* Simple CSS shapes for now instead of more images to keep it fast */}
             {obs.type === 'rock' && <div className="w-full h-full bg-stone-600 rounded-t-xl border-b-4 border-stone-800" />}
             {obs.type === 'bush' && <div className="w-full h-full bg-green-600 rounded-full border-b-4 border-green-800" />}
          </div>
        ))}

        {coinsRef.current.map((c, i) => !c.collected && (
          <div
            key={`coin-${i}`}
            className="absolute z-10"
            style={{ 
              left: c.x, 
              bottom: -c.y, // c.y is negative in logic relative to player, so flip for CSS bottom
              width: 30, 
              height: 30 
            }}
          >
            <img src={coinImg} className="w-full h-full object-contain animate-[spin_3s_linear_infinite]" />
          </div>
        ))}

      </div>

      {/* Touch Controls Overlay */}
      <div 
        className="absolute inset-0 z-40" 
        onClick={handleJump}
        onTouchStart={handleJump}
      />

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
