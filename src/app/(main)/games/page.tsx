"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChessGame from "@/components/games/chess-game";
import SnakeGame from "@/components/games/snake-game";
import SnakesAndLaddersGame from "@/components/games/snakes-and-ladders-game";
import CarRacingGame from "@/components/games/car-racing-game";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/firebase";
import { Car, Users, Gamepad2, Trophy, Sparkles, Zap, ShieldAlert, Cpu, Activity, ChevronRight, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

type Game = "chess" | "snake" | "snakes-and-ladders" | "car-racing" | null;

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<Game>(null);
  const { user } = useUser();
  const router = useRouter();

  const renderGame = () => {
    switch (activeGame) {
      case "chess":
        return <ChessGame />;
      case "snake":
        return <SnakeGame userId={user?.uid} />;
      case "snakes-and-ladders":
        return <SnakesAndLaddersGame userId={user?.uid} />;
      case "car-racing":
        return <CarRacingGame />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-1000">
            <div className="bg-primary/5 p-12 rounded-[3rem] border-2 border-dashed border-primary/10 mb-8 shadow-inner">
              <Gamepad2 className="h-24 w-24 text-primary/20 animate-pulse" />
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter text-muted-foreground uppercase leading-none">Arena Standby</h2>
            <p className="text-sm font-bold text-muted-foreground/40 mt-4 max-w-xs mx-auto uppercase tracking-[0.3em]">Initialize a mission shard from the control deck to begin combat operations.</p>
          </div>
        );
    }
  };

  const getGameTitle = () => {
    if (activeGame === "snakes-and-ladders") return "LADDER ASCENSION";
    if (activeGame === "car-racing") return "TURBO OVERDRIVE";
    if (activeGame) return activeGame.toUpperCase();
    return "COMMAND ARENA";
  };

  return (
    <div className="container mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <style>{`
        .cc-mono { font-family: 'Orbitron', sans-serif; }
        .cc-root { font-family: 'Rajdhani', sans-serif; }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner group">
            <Sparkles className="h-10 w-10 text-primary transition-transform group-hover:rotate-12 duration-500" />
          </div>
          <div>
            <h1 className="cc-mono text-5xl font-black italic tracking-tighter uppercase leading-none text-foreground">Gaming Hub</h1>
            <div className="flex items-center gap-2 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">High-Fidelity Combat Protocol Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 px-4">
        {/* MISSION CONTROL DECK */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-3xl bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
            <CardHeader className="bg-muted/30 border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-black italic uppercase tracking-tight">Mission Shards</CardTitle>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Select Battlefield</p>
                </div>
                <Activity className="h-4 w-4 text-primary animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              {[
                { id: "chess", icon: "♟️", label: "CHESS GRANDMASTER", sub: "Tactical Intelligence" },
                { id: "snake", icon: "🐍", label: "NEON SNAKE", sub: "Reflex Calibration" },
                { id: "snakes-and-ladders", icon: "🪜", label: "LADDER ASCENSION", sub: "Probability Matrix" },
                { id: "car-racing", icon: <Car className="h-4 w-4" />, label: "TURBO OVERDRIVE", sub: "Velocity Engine" }
              ].map((game) => (
                <Button
                  key={game.id}
                  onClick={() => setActiveGame(game.id as Game)}
                  className={cn(
                    "w-full h-20 justify-start gap-4 px-6 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden",
                    activeGame === game.id 
                        ? "bg-primary text-primary-foreground border-primary shadow-xl scale-[1.02]" 
                        : "bg-background/50 border-border/50 hover:border-primary/50 text-foreground hover:bg-primary/5"
                  )}
                >
                  <div className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-xl text-xl transition-all",
                      activeGame === game.id ? "bg-white/20 text-white" : "bg-muted text-primary"
                  )}>
                    {game.icon}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black italic text-sm uppercase tracking-tight">{game.label}</span>
                    <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        activeGame === game.id ? "text-white/60" : "text-muted-foreground/60"
                    )}>{game.sub}</span>
                  </div>
                  {activeGame === game.id && (
                      <div className="absolute right-4 animate-in slide-in-from-left-4">
                          <ChevronRight className="h-5 w-5 opacity-40" />
                      </div>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* COMBAT READINESS */}
          <Card className="border-2 border-primary/20 bg-primary/5 shadow-2xl rounded-[2.5rem] overflow-hidden group">
               <CardHeader className="p-6 pb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldAlert className="h-5 w-5 animate-pulse" />
                    <CardTitle className="text-[11px] font-black italic uppercase tracking-widest">Combat Readiness</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="p-6 pt-2 space-y-4">
                  <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">
                    Identity <span className="text-primary font-bold">{user?.email?.split('@')[0]}</span> is cleared for all high-stakes arena engagements.
                  </p>
                  <Button 
                    onClick={() => router.push('/connect')}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black italic uppercase tracking-tighter rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  >
                    CHALLENGE PEER <Users className="ml-2 h-4 w-4" />
                  </Button>
               </CardContent>
          </Card>

          <Card className="bg-muted/30 border-none rounded-[2.5rem] shadow-inner">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]" />
              <h3 className="cc-mono text-sm font-black uppercase tracking-widest mb-1">Hall of Fame</h3>
              <p className="text-[10px] text-muted-foreground font-bold mb-6 uppercase tracking-widest opacity-60">Global Ranking Index</p>
              <Button onClick={() => router.push('/leaderboard')} variant="outline" size="sm" className="w-full h-10 font-black italic tracking-widest border-2 rounded-xl hover:bg-primary hover:text-white transition-all">VIEW STANDINGS</Button>
            </CardContent>
          </Card>
        </div>

        {/* ACTIVE COMBAT ARENA */}
        <div className="lg:col-span-3">
          <Card className="min-h-[700px] border-none shadow-3xl overflow-hidden bg-card/40 backdrop-blur-2xl relative rounded-[3rem] ring-1 ring-white/10 flex flex-col">
            <CardHeader className="bg-muted/20 border-b py-5 px-8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Cpu className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="cc-mono text-2xl font-black italic uppercase tracking-tighter text-primary">{getGameTitle()}</CardTitle>
                </div>
                {activeGame && (
                  <div className="flex items-center gap-3 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Secure Live Node</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-0 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <svg width="100%" height="100%"><defs><pattern id="arena-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#arena-grid)" /></svg>
              </div>
              {renderGame()}
            </CardContent>
            
            <div className="p-4 bg-muted/20 border-t flex items-center justify-between px-8 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
                <span>Packet Latency: 12ms</span>
                <span>Neural Bridge v4.0</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
