
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Zap, Gauge, Move, Flame } from "lucide-react";
import placeholderImages from "@/app/lib/placeholder-images.json";

export const carOptions = [
  { name: "Ferrari", color: "bg-red-600", topSpeed: 6.5, acceleration: 0.08, braking: 0.15, handling: 4.5, nitro: 80, imageKey: "ferrari" },
  { name: "Lamborghini", color: "bg-yellow-400", topSpeed: 6.2, acceleration: 0.09, braking: 0.14, handling: 4.2, nitro: 85, imageKey: "lamborghini" },
  { name: "Hypercar", color: "bg-blue-600", topSpeed: 7.2, acceleration: 0.07, braking: 0.12, handling: 3.8, nitro: 95, imageKey: "hypercar" },
  { name: "Supercar", color: "bg-green-500", topSpeed: 5.8, acceleration: 0.1, braking: 0.18, handling: 4.8, nitro: 70, imageKey: "supercar" },
];

export type CarType = typeof carOptions[0];

interface CarSelectionProps {
  onGameStart: (playerCar: CarType) => void;
}

export default function CarSelection({ onGameStart }: CarSelectionProps) {
  const [playerCar, setPlayerCar] = useState<CarType | null>(null);

  const renderCarOption = (car: CarType) => {
    const isSelected = playerCar?.name === car.name;
    const imageData = placeholderImages[car.imageKey as keyof typeof placeholderImages];
    
    return (
        <Button
            key={car.name}
            variant={isSelected ? "secondary" : "outline"}
            onClick={() => setPlayerCar(car)}
            className={cn(
                "h-auto flex-col items-start p-0 text-left transition-all duration-300 w-full bg-slate-900/40 border-slate-800 overflow-hidden group border-2",
                isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background border-primary shadow-2xl scale-[1.02] bg-slate-800/80"
            )}
        >
            <div className="relative w-full h-40 overflow-hidden">
                <Image
                    src={imageData.src}
                    alt={imageData.alt}
                    width={imageData.width}
                    height={imageData.height}
                    data-ai-hint={imageData.hint}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-4 flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] ${car.color}`} />
                        <span className="font-black italic uppercase tracking-tighter text-xl text-white drop-shadow-md">
                            {car.name}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 p-4 w-full bg-slate-950/40">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Gauge className="h-3.5 w-3.5 text-blue-400" /> 
                    <div className="flex flex-col">
                        <span>Speed</span>
                        <span className="text-white text-xs">{car.topSpeed}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" /> 
                    <div className="flex flex-col">
                        <span>Nitro</span>
                        <span className="text-white text-xs">{car.nitro}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Move className="h-3.5 w-3.5 text-green-400" /> 
                    <div className="flex flex-col">
                        <span>Steer</span>
                        <span className="text-white text-xs">{car.handling}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Flame className="h-3.5 w-3.5 text-red-400" /> 
                    <div className="flex flex-col">
                        <span>Power</span>
                        <span className="text-white text-xs">{car.acceleration.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </Button>
    )
  }

  return (
    <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-500 mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h2 className="text-6xl font-black italic tracking-tighter text-primary animate-pulse drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)]">CHOOSE YOUR RIDE</h2>
            <div className="flex items-center justify-center gap-4 mt-4">
                <div className="h-px bg-slate-800 flex-1 max-w-[100px]" />
                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Select a vehicle to dominate the arena</p>
                <div className="h-px bg-slate-800 flex-1 max-w-[100px]" />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {carOptions.map((car) => renderCarOption(car))}
        </div>

        <div className="flex justify-center mt-12">
            <Button
                onClick={() => onGameStart(playerCar!)}
                disabled={!playerCar}
                className="w-full max-w-md h-20 text-4xl font-black italic tracking-tighter bg-primary hover:bg-primary/90 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.6)] transition-all active:scale-95 rounded-2xl border-b-8 border-primary/20 group"
            >
                START ENGINE
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap className="h-8 w-8 fill-current" />
                </div>
            </Button>
        </div>
        <p className="text-center text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.5em] mt-8">Unity Pro Racing Engine v3.0</p>
    </div>
  );
}
