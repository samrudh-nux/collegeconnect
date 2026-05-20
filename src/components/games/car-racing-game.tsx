"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CarSelection, { CarType, carOptions } from './car-selection';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Zap, Gauge, ChevronLeft, ChevronRight, Trophy, Cpu, Volume2, VolumeX, Timer, Flag, FastForward } from 'lucide-react';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 850;
const CAR_WIDTH = 38;
const CAR_HEIGHT = 65;
const TRUCK_WIDTH = 42;
const TRUCK_HEIGHT = 120;
const ROAD_BORDER_WIDTH = 30;
const TRACK_LENGTH = 155000; 
const MAX_NITRO = 100;

const TRAFFIC_COLORS = ['#F97316', '#A855F7', '#F1F5F9', '#EAB308', '#06B6D4', '#EC4899'];

type PlayerState = {
  car: CarType;
  x: number;
  y: number;
  speed: number;
  progress: number;
  nitroLevel: number;
  isNitroActive: boolean;
  lane: number;
  steeringAngle: number;
  isAI?: boolean;
};

type Obstacle = {
  id: number;
  x: number;
  y: number;
  speed: number;
  color: string;
  type: 'car' | 'truck';
};

const getColorHex = (carName: string) => {
    switch(carName) {
        case 'Ferrari': return '#EF4444'; 
        case 'Lamborghini': return '#FACC15'; 
        case 'Hypercar': return '#3B82F6'; 
        case 'Supercar': return '#22C55E'; 
        default: return TRAFFIC_COLORS[0];
    }
}

const drawDetailedVehicle = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, type: 'car' | 'truck' = 'car', isNitro: boolean = false, isAI: boolean = false, speed: number = 0) => {
    const width = type === 'car' ? CAR_WIDTH : TRUCK_WIDTH;
    const height = type === 'car' ? CAR_HEIGHT : TRUCK_HEIGHT;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, width, height, 10);
    ctx.fill();

    if (isNitro) {
        ctx.save();
        ctx.fillStyle = '#60A5FA';
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#3B82F6';
        const flicker = Math.random() * 25;
        ctx.beginPath(); ctx.moveTo(x + 10, y + height); ctx.lineTo(x + 15, y + height + 70 + flicker); ctx.lineTo(x + 20, y + height); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + width - 10, y + height); ctx.lineTo(x + width - 15, y + height + 70 + flicker); ctx.lineTo(x + width - 20, y + height); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.moveTo(x + 12, y + height); ctx.lineTo(x + 15, y + height + 30); ctx.lineTo(x + 18, y + height); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + width - 12, y + height); ctx.lineTo(x + width - 15, y + height + 30); ctx.lineTo(x + width - 18, y + height); ctx.fill();
        ctx.restore();
    }

    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, isAI ? color : '#FFFFFF');
    gradient.addColorStop(1, color);

    ctx.fillStyle = isAI ? color : gradient;
    ctx.beginPath(); ctx.roundRect(x, y, width, height, 10); ctx.fill();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath(); ctx.roundRect(x + 5, y + 12, width - 10, 20, 6); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 6, y + height - 25, width - 12, 12, 4); ctx.fill();

    if (!isAI) {
        ctx.fillStyle = '#FFFBEB';
        ctx.shadowBlur = speed > 5 ? 25 : 10;
        ctx.shadowColor = '#FDE68A';
        ctx.fillRect(x + 5, y + 2, 8, 4);
        ctx.fillRect(x + width - 13, y + 2, 8, 4);
        ctx.shadowBlur = 0;
    }
};

export default function CarRacingGame() {
  const [gameState, setGameState] = useState<'selection' | 'countdown' | 'racing' | 'finished'>('selection');
  const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [isMuted, setIsMuted] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerState = useRef<PlayerState | null>(null);
  const aiState = useRef<PlayerState | null>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const animationFrameId = useRef<number>(null);
  const roadOffset = useRef(0);
  const obstacleSpawnTimer = useRef(0);
  const nextObstacleId = useRef(0);
  const shakeIntensity = useRef(0);
  const startTime = useRef<number>(0);

  // Audio Refs
  const audioRefs = useRef<{
    music: HTMLAudioElement | null;
    engine: HTMLAudioElement | null;
    nitro: HTMLAudioElement | null;
    crash: HTMLAudioElement | null;
    victory: HTMLAudioElement | null;
  }>({ music: null, engine: null, nitro: null, crash: null, victory: null });

  const stopAllSounds = useCallback(() => {
    Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
  }, []);

  const initAudio = useCallback(() => {
    if (audioRefs.current.music) return; // Only init once
    audioRefs.current.music = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3");
    audioRefs.current.engine = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3");
    audioRefs.current.nitro = new Audio("https://cdn.pixabay.com/download/audio/2024/05/17/audio_030e466e0e.mp3?filename=rocket-thrusters-1.mp3");
    audioRefs.current.crash = new Audio("https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8e9b60e32.mp3?filename=car-crash-1.mp3");
    audioRefs.current.victory = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_119426f86b.mp3?filename=cheering-crowd-1.mp3");
    
    audioRefs.current.music.loop = true;
    audioRefs.current.music.volume = 0.4;
    audioRefs.current.engine.loop = true;
    audioRefs.current.engine.volume = 0.3;
  }, []);

  const startGame = (selectedCar: CarType) => {
    initAudio();
    stopAllSounds();

    const roadWidth = CANVAS_WIDTH - (ROAD_BORDER_WIDTH * 2);
    const laneWidth = roadWidth / 2;
    const randomAiCar = carOptions[Math.floor(Math.random() * carOptions.length)];

    playerState.current = {
      car: selectedCar,
      x: ROAD_BORDER_WIDTH + (laneWidth / 2) - (CAR_WIDTH / 2),
      y: CANVAS_HEIGHT - CAR_HEIGHT - 120,
      speed: 0, progress: 0, nitroLevel: MAX_NITRO, isNitroActive: false, lane: 0, steeringAngle: 0,
    };

    aiState.current = {
      car: randomAiCar,
      x: ROAD_BORDER_WIDTH + laneWidth + (laneWidth / 2) - (CAR_WIDTH / 2),
      y: CANVAS_HEIGHT - CAR_HEIGHT - 120,
      speed: 0, progress: 0, nitroLevel: MAX_NITRO, isNitroActive: false, lane: 1, steeringAngle: 0, isAI: true,
    };

    setWinner(null);
    setObstacles([]);
    setCountdown(3);
    setRaceTime(0);
    setGameState('countdown');

    // Force unlock audio shards within user interaction event loop
    if (!isMuted) {
        audioRefs.current.music?.play().catch(() => {});
        audioRefs.current.engine?.play().catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopAllSounds();
    };
  }, [stopAllSounds]);

  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
        setGameState('racing');
        startTime.current = Date.now();
    }
  }, [gameState, countdown]);

  const gameLoop = useCallback(() => {
    if (gameState !== 'racing') return;

    const player = playerState.current;
    const ai = aiState.current;
    const keys = keysPressed.current;
    if (!player || !ai) return;

    setRaceTime(Math.floor((Date.now() - startTime.current) / 1000));
    roadOffset.current = (roadOffset.current + player.speed * 10) % 150;

    const isGasPressed = keys['w'] || keys['arrowup'] || keys['gas'];
    const isNitroRequested = (keys['q'] || keys['nitro']) && player.nitroLevel > 0;
    
    if (player.isNitroActive !== isNitroRequested && !isMuted) {
        if (isNitroRequested) audioRefs.current.nitro?.play().catch(() => {});
        else audioRefs.current.nitro?.pause();
    }
    player.isNitroActive = isNitroRequested;

    if (player.isNitroActive) {
        player.nitroLevel = Math.max(0, player.nitroLevel - 3.2);
        player.speed += player.car.acceleration * 3.5;
        shakeIntensity.current = 12;
    } else {
        player.nitroLevel = Math.min(MAX_NITRO, player.nitroLevel + 0.3);
        if (isGasPressed) player.speed += player.car.acceleration;
        else player.speed *= 0.98;
        shakeIntensity.current = Math.max(0, shakeIntensity.current - 0.8);
    }

    if (keys['s'] || keys['arrowdown']) player.speed = Math.max(0, player.speed - player.car.braking * 1.8);
    const topSpeed = player.isNitroActive ? player.car.topSpeed * 1.8 : player.car.topSpeed;
    player.speed = Math.min(player.speed, topSpeed);
    
    const steerTarget = (keys['a'] || keys['arrowleft'] || keys['left'] ? -1 : 0) + (keys['d'] || keys['arrowright'] || keys['right'] ? 1 : 0);
    player.steeringAngle = Math.max(-1, Math.min(1, player.steeringAngle + steerTarget * 0.25));
    if (steerTarget === 0) player.steeringAngle *= 0.65;
    player.x += player.steeringAngle * player.car.handling;
    player.x = Math.max(ROAD_BORDER_WIDTH + 10, Math.min(player.x, CANVAS_WIDTH - ROAD_BORDER_WIDTH - CAR_WIDTH - 10));
    player.progress += player.speed;

    if (audioRefs.current.engine && !isMuted) {
        audioRefs.current.engine.playbackRate = 0.5 + (player.speed / player.car.topSpeed);
    }

    // AI Logic
    if (ai.speed < ai.car.topSpeed * 0.95) ai.speed += ai.car.acceleration;
    ai.progress += ai.speed;
    const relativeY = (CANVAS_HEIGHT - CAR_HEIGHT - 120) - (ai.progress - player.progress) * 0.18;
    ai.y = Math.max(-300, Math.min(CANVAS_HEIGHT + 300, relativeY));

    // Obstacle Logic
    obstacleSpawnTimer.current += 1;
    if (obstacleSpawnTimer.current > Math.max(15, 90 - player.speed * 15)) {
        obstacleSpawnTimer.current = 0;
        const lane = Math.floor(Math.random() * 2);
        const spawnX = ROAD_BORDER_WIDTH + (lane * ((CANVAS_WIDTH - ROAD_BORDER_WIDTH * 2) / 2)) + ((CANVAS_WIDTH - ROAD_BORDER_WIDTH * 2) / 4) - CAR_WIDTH / 2;
        setObstacles(prev => [...prev, { id: nextObstacleId.current++, x: spawnX, y: -200, speed: (Math.random() * 5) + 3, color: TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)], type: Math.random() > 0.8 ? 'truck' : 'car' }]);
    }
    
    setObstacles(prev => prev.map(o => ({ ...o, y: o.y + o.speed + player.speed * 0.95 })).filter(o => o.y < CANVAS_HEIGHT + 300));

    const collision = obstacles.some(o => {
        const oWidth = o.type === 'car' ? CAR_WIDTH : TRUCK_WIDTH;
        const oHeight = o.type === 'car' ? CAR_HEIGHT : TRUCK_HEIGHT;
        return (player.x < o.x + oWidth - 8 && player.x + CAR_WIDTH > o.x + 8 && player.y < o.y + oHeight - 8 && player.y + CAR_HEIGHT > o.y + 8);
    });

    if (collision) {
        stopAllSounds();
        if (!isMuted) audioRefs.current.crash?.play().catch(() => {});
        setWinner('CPU');
        setGameState('finished');
        return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.save();
    if (shakeIntensity.current > 0) ctx.translate((Math.random() - 0.5) * shakeIntensity.current, (Math.random() - 0.5) * shakeIntensity.current);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#064e3b'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#111827'; ctx.fillRect(ROAD_BORDER_WIDTH, 0, CANVAS_WIDTH - (ROAD_BORDER_WIDTH * 2), CANVAS_HEIGHT);
    ctx.strokeStyle = '#FACC15'; ctx.lineWidth = 5; ctx.setLineDash([60, 60]); ctx.lineDashOffset = -roadOffset.current;
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH / 2, 0); ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT); ctx.stroke();
    
    obstacles.forEach(o => drawDetailedVehicle(ctx, o.x, o.y, o.color, o.type, false, false, 0));
    drawDetailedVehicle(ctx, ai.x, ai.y, getColorHex(ai.car.name), 'car', ai.isNitroActive, true, ai.speed);
    drawDetailedVehicle(ctx, player.x, player.y, getColorHex(player.car.name), 'car', player.isNitroActive, false, player.speed);
    ctx.restore();

    if (player.progress >= TRACK_LENGTH || ai.progress >= TRACK_LENGTH) {
        stopAllSounds();
        const playerWins = player.progress >= TRACK_LENGTH;
        if (playerWins && !isMuted) audioRefs.current.victory?.play().catch(() => {});
        setWinner(playerWins ? 'PLAYER' : 'CPU');
        setGameState('finished');
    } else {
        animationFrameId.current = window.requestAnimationFrame(gameLoop);
    }
  }, [gameState, obstacles, isMuted, stopAllSounds]);

  useEffect(() => {
    if (gameState === 'racing') animationFrameId.current = window.requestAnimationFrame(gameLoop);
    return () => { if (animationFrameId.current) window.cancelAnimationFrame(animationFrameId.current); };
  }, [gameState, gameLoop]);

  if (gameState === 'selection') return <CarSelection onGameStart={startGame} />;

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto gap-4 p-2 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <Card className="bg-slate-950/90 border-primary/50 text-white p-4 rounded-2xl ring-1 ring-primary/20">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">OPERATOR</span>
            <div className="flex items-center gap-3 mt-1">
                <Gauge className="h-5 w-5 text-primary" />
                <span className="text-3xl font-black italic tracking-tighter">{(playerState.current?.speed || 0 * 8).toFixed(0)}</span>
            </div>
            <Progress value={playerState.current?.nitroLevel} className="h-1.5 mt-2 bg-slate-800" />
        </Card>
        <Card className="hidden lg:flex flex-col justify-center items-center bg-slate-950/90 border-violet-500/50 text-white p-4 rounded-2xl ring-1 ring-violet-500/20">
            <Timer className="h-4 w-4 text-violet-400" />
            <span className="text-4xl font-black italic tracking-tighter text-white font-mono">{raceTime}s</span>
        </Card>
        <Card className="bg-slate-950/90 border-red-500/50 text-white p-4 rounded-2xl ring-1 ring-red-500/20">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-400">NODE_AI</span>
            <div className="mt-2 w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${(aiState.current?.progress || 0) / TRACK_LENGTH * 100}%` }} />
            </div>
        </Card>
      </div>

      <div className="relative p-3 bg-slate-900/40 rounded-[3rem] border border-white/10 backdrop-blur-md shadow-3xl">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="rounded-[2.5rem] shadow-3xl border-8 border-slate-950 bg-black"/>
        <div className="absolute top-8 left-8">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl h-10 w-10 text-white">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
        </div>
        {gameState === 'countdown' && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-[2.5rem] z-50">
                <p className="text-[12rem] font-black text-white italic animate-bounce-slow">{countdown > 0 ? countdown : 'GO'}</p>
             </div>
        )}
        {gameState === 'finished' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 rounded-[2.5rem] text-white text-center p-8 z-50">
                <Trophy className={cn("h-24 w-24 mb-6", winner === 'PLAYER' ? 'text-yellow-400' : 'text-slate-500')} />
                <h2 className={cn("text-6xl font-black italic tracking-tighter mb-2", winner === 'PLAYER' ? 'text-primary' : 'text-red-500')}>{winner === 'PLAYER' ? 'YOU WIN' : 'YOU LOSE'}</h2>
                <Button onClick={() => setGameState('selection')} className="w-full h-20 bg-primary hover:bg-primary/90 text-2xl font-black italic rounded-2xl mt-10">RE-INITIALIZE ENGINE</Button>
            </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 w-full max-w-lg p-6 bg-slate-950/80 rounded-[2.5rem] border-2 border-white/10 shadow-2xl">
          <Button className="h-20 w-20 bg-slate-900 rounded-2xl" onMouseDown={() => { keysPressed.current['left'] = true; }} onMouseUp={() => { keysPressed.current['left'] = false; }} onTouchStart={(e) => { e.preventDefault(); keysPressed.current['left'] = true; }} onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['left'] = false; }}><ChevronLeft className="h-10 w-10 text-primary" /></Button>
          <Button className="flex-1 h-20 bg-yellow-500 rounded-2xl font-black italic text-black" onMouseDown={() => { keysPressed.current['nitro'] = true; }} onMouseUp={() => { keysPressed.current['nitro'] = false; }} onTouchStart={(e) => { e.preventDefault(); keysPressed.current['nitro'] = true; }} onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['nitro'] = false; }}><FastForward className="h-6 w-6 mr-2" /> NITRO</Button>
          <Button className="h-20 w-20 bg-slate-900 rounded-2xl" onMouseDown={() => { keysPressed.current['right'] = true; }} onMouseUp={() => { keysPressed.current['right'] = false; }} onTouchStart={(e) => { e.preventDefault(); keysPressed.current['right'] = true; }} onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['right'] = false; }}><ChevronRight className="h-10 w-10 text-primary" /></Button>
          <Button className="h-20 px-8 bg-red-600 rounded-2xl font-black italic text-white" onMouseDown={() => { keysPressed.current['gas'] = true; }} onMouseUp={() => { keysPressed.current['gas'] = false; }} onTouchStart={(e) => { e.preventDefault(); keysPressed.current['gas'] = true; }} onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['gas'] = false; }}>DRIVE</Button>
      </div>
    </div>
  );
}