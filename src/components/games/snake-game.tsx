
"use client";

import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Trophy, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CANVAS_SIZE = 320;
const TILE_COUNT = 20;
const TILE_SIZE = CANVAS_SIZE / TILE_COUNT;

type SnakePart = { x: number; y: number };

export default function SnakeGame({ userId }: { userId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<SnakePart[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<SnakePart>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<{ x: number; y: number }>({ x: 0, y: -1 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const { toast } = useToast();
  const db = useFirestore();

  // Fetch High Score on mount
  useEffect(() => {
    if (!userId || !db) return;
    const fetchHighScore = async () => {
      const userRef = doc(db, "userProfiles", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setHighScore(userDoc.data().highScore || 0);
      }
    };
    fetchHighScore();
  }, [userId, db]);

  const placeFood = () => {
    setFood({
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT),
    });
  };

  const updateScoreInFirebase = async (newScore: number) => {
    if (!userId || !db) return;
    const userRef = doc(db, "userProfiles", userId);
    try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && newScore > (userDoc.data().highScore || 0)) {
            const updateData = { highScore: newScore };
            setHighScore(newScore);
            updateDoc(userRef, updateData)
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: userRef.path,
                        operation: 'update',
                        requestResourceData: updateData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
        }
    } catch(e) {
        // Silent error
    }
  };

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    placeFood();
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const handleMove = (newDir: { x: number; y: number }) => {
    if (isGameOver) return;
    if (isPaused) setIsPaused(false);
    // Prevent 180 degree turns
    if (newDir.x !== 0 && direction.x !== 0) return;
    if (newDir.y !== 0 && direction.y !== 0) return;
    setDirection(newDir);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); handleMove({ x: 0, y: -1 }); break;
        case "ArrowDown": e.preventDefault(); handleMove({ x: 0, y: 1 }); break;
        case "ArrowLeft": e.preventDefault(); handleMove({ x: -1, y: 0 }); break;
        case "ArrowRight": e.preventDefault(); handleMove({ x: 1, y: 0 }); break;
        case " ": e.preventDefault(); setIsPaused(!isPaused); break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [direction, isGameOver, isPaused]);

  useEffect(() => {
    if (isGameOver || isPaused) return;
    
    const gameLoop = setInterval(() => {
      const head = snake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      if (
        newHead.x < 0 || newHead.x >= TILE_COUNT ||
        newHead.y < 0 || newHead.y >= TILE_COUNT ||
        snake.some(p => p.x === newHead.x && p.y === newHead.y)
      ) {
        setIsGameOver(true);
        return;
      }

      setSnake((prevSnake) => {
        const newSnake = [newHead, ...prevSnake];
        if (newHead.x === food.x && newHead.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          updateScoreInFirebase(newScore);
          placeFood();
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 120);

    return () => clearInterval(gameLoop);
  }, [snake, direction, food, score, isGameOver, isPaused]);

  useEffect(() => {
    if (isGameOver) {
      toast({
        title: "Mission Failed!",
        description: `Your score: ${score}. Reach higher next time!`,
      });
    }
  }, [isGameOver, score, toast]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Subtle Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * TILE_SIZE, 0);
      ctx.lineTo(i * TILE_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * TILE_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * TILE_SIZE);
      ctx.stroke();
    }

    // Snake with Glow
    snake.forEach((part, index) => {
      ctx.shadowBlur = index === 0 ? 15 : 5;
      ctx.shadowColor = "#22c55e";
      ctx.fillStyle = index === 0 ? "#4ade80" : "#16a34a";
      
      const padding = 1.5;
      const size = TILE_SIZE - (padding * 2);
      
      // Rounded body
      ctx.beginPath();
      ctx.roundRect(
        part.x * TILE_SIZE + padding, 
        part.y * TILE_SIZE + padding, 
        size, 
        size, 
        index === 0 ? 6 : 4
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Food (Neon Red Pulsing effect concept)
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ef4444";
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(
        food.x * TILE_SIZE + TILE_SIZE / 2,
        food.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    if (isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", CANVAS_SIZE/2, CANVAS_SIZE/2 - 20);
        ctx.fillStyle = "white";
        ctx.font = "16px sans-serif";
        ctx.fillText(`Final Score: ${score}`, CANVAS_SIZE/2, CANVAS_SIZE/2 + 20);
    } else if (isPaused && !isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "white";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", CANVAS_SIZE/2, CANVAS_SIZE/2 + 10);
        ctx.font = "12px sans-serif";
        ctx.fillText("Press Arrow or Tap to Start", CANVAS_SIZE/2, CANVAS_SIZE/2 + 35);
    }
  }, [snake, food, isGameOver, score, isPaused]);

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-slate-900/40 rounded-3xl shadow-inner border border-white/5">
      <div className="flex justify-between w-full max-w-[320px] items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary font-black tracking-tighter text-2xl">
            <Target className="h-5 w-5" />
            {score}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score</span>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-yellow-500 font-black tracking-tighter text-lg">
             {highScore}
             <Trophy className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Record</span>
        </div>
      </div>

      <div className="relative border-8 border-slate-800 rounded-[2rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] bg-black">
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="cursor-none" onClick={() => isPaused && setIsPaused(false)} />
        {isGameOver && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6">
            <Button onClick={resetGame} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 font-bold gap-2">
              <RotateCcw className="h-4 w-4" /> TRY AGAIN
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
        <div />
        <Button 
          variant="secondary" 
          className="h-16 w-16 rounded-2xl shadow-xl bg-slate-800 border-b-4 border-slate-950 hover:translate-y-0.5 active:border-b-0" 
          onClick={() => handleMove({ x: 0, y: -1 })}
          disabled={isGameOver}
        >
          <ChevronUp className="h-10 w-10 text-primary" />
        </Button>
        <div />
        
        <Button 
          variant="secondary" 
          className="h-16 w-16 rounded-2xl shadow-xl bg-slate-800 border-b-4 border-slate-950 hover:translate-y-0.5 active:border-b-0" 
          onClick={() => handleMove({ x: -1, y: 0 })}
          disabled={isGameOver}
        >
          <ChevronLeft className="h-10 w-10 text-primary" />
        </Button>
        <Button 
          variant="secondary" 
          className="h-16 w-16 rounded-2xl shadow-xl bg-slate-800 border-b-4 border-slate-950 hover:translate-y-0.5 active:border-b-0" 
          onClick={() => handleMove({ x: 0, y: 1 })}
          disabled={isGameOver}
        >
          <ChevronDown className="h-10 w-10 text-primary" />
        </Button>
        <Button 
          variant="secondary" 
          className="h-16 w-16 rounded-2xl shadow-xl bg-slate-800 border-b-4 border-slate-950 hover:translate-y-0.5 active:border-b-0" 
          onClick={() => handleMove({ x: 1, y: 0 })}
          disabled={isGameOver}
        >
          <ChevronRight className="h-10 w-10 text-primary" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="outline" className="border-slate-800 text-slate-500 font-bold tracking-widest py-1">
          ARCADEMODE
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:bg-white/5">
           {isPaused ? "RESUME" : "PAUSE"}
        </Button>
      </div>
    </div>
  );
}
