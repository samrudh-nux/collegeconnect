
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { RotateCcw, PlayCircle, Loader2, Trophy } from "lucide-react";

const BOARD_SIZE = 100;
const DIMENTION = 10;

const SNAKES: Record<number, number> = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS: Record<number, number> = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

const COLORS = [
  "bg-red-100/50",
  "bg-blue-100/50",
  "bg-yellow-100/50",
  "bg-green-100/50"
];

export default function SnakesAndLaddersGame({ userId }: { userId?: string }) {
  const [position, setPosition] = useState(1);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rolling, setRolling] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const rollDice = () => {
    if (isGameOver || rolling) return;
    setRolling(true);
    
    // Simulate dice animation
    const roll = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(() => {
      setDiceRoll(roll);
      let newPosition = position + roll;
      
      if (newPosition > BOARD_SIZE) {
        newPosition = position;
        toast({ title: 'Oops!', description: `You need exactly ${BOARD_SIZE - position} to win! Still at ${position}.` });
      } else {
        let message = `You rolled a ${roll} and moved to ${newPosition}.`;
        
        if (LADDERS[newPosition]) {
          const climbedTo = LADDERS[newPosition];
          message += ` Ladder! You climbed up to ${climbedTo}!`;
          setScore(s => s + 20);
          newPosition = climbedTo;
        } else if (SNAKES[newPosition]) {
          const slidTo = SNAKES[newPosition];
          message += ` Snake! You slid down to ${slidTo}.`;
          setScore(s => Math.max(0, s - 10));
          newPosition = slidTo;
        }

        toast({ title: 'Game Update', description: message });
        setPosition(newPosition);

        if (newPosition === BOARD_SIZE) {
          setIsGameOver(true);
          const finalScore = score + 100;
          setScore(finalScore);
          toast({ title: "Winner!", description: `Congratulations! Final Score: ${finalScore}` });
          updateScoreInFirebase(finalScore);
        }
      }
      setRolling(false);
    }, 600);
  };
  
  const updateScoreInFirebase = async (newScore: number) => {
    if (!userId || !db) return;
    const userRef = doc(db, "userProfiles", userId);
    try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && newScore > (userDoc.data().highScore || 0)) {
            const updateData = { highScore: newScore };
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
        console.error(e);
    }
  };

  const resetGame = () => {
    setPosition(1);
    setDiceRoll(null);
    setIsGameOver(false);
    setScore(0);
    setRolling(false);
  };

  const renderBoard = () => {
    const board = [];
    for (let row = DIMENTION - 1; row >= 0; row--) {
      const cells = [];
      for (let col = 0; col < DIMENTION; col++) {
        let num = row * DIMENTION + col + 1;
        // Zig-zag pattern
        if (row % 2 !== 0) {
          num = row * DIMENTION + (DIMENTION - col);
        }
        
        let cellContent: React.ReactNode = <span className="text-[10px] text-muted-foreground/30 font-bold">{num}</span>;
        let className = "relative border border-muted flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 transition-all duration-300";
        
        // Add color
        className = cn(className, COLORS[num % 4]);

        if (position === num) {
          cellContent = (
            <div className="z-20 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary border-2 border-white shadow-lg animate-bounce flex items-center justify-center text-[8px] font-bold text-white">
              YOU
            </div>
          );
        } else if (LADDERS[num]) {
          cellContent = <span className="text-lg sm:text-2xl z-10">🪜</span>;
        } else if (SNAKES[num]) {
          cellContent = <span className="text-lg sm:text-2xl z-10">🐍</span>;
        }

        cells.push(
          <div key={num} className={className}>
            {cellContent}
          </div>
        );
      }
      board.push(<div key={row} className="flex">{cells}</div>);
    }
    return board;
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-4 animate-in fade-in duration-500">
      
      <div className="flex justify-between w-full px-4 mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Position</span>
          <span className="text-2xl font-black text-primary">{position}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Score
          </span>
          <span className="text-2xl font-black text-primary">{score}</span>
        </div>
      </div>

      <div className="border-4 border-card rounded-lg shadow-xl bg-card p-1">
        <div className="inline-block">
          {renderBoard()}
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-6 mt-4">
        {isGameOver ? (
          <Button onClick={resetGame} size="lg" className="w-full h-14 text-xl font-bold gap-2">
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex items-center gap-4 w-full">
              <Button 
                onClick={rollDice} 
                disabled={rolling} 
                className="flex-1 h-16 text-lg font-bold shadow-lg"
              >
                {rolling ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Roll Dice
                  </div>
                )}
              </Button>

              <div className="h-16 w-16 flex items-center justify-center bg-muted rounded-xl border-2 border-primary/20 shadow-inner">
                {diceRoll ? (
                  <span className="text-3xl font-black text-primary animate-in zoom-in">{diceRoll}</span>
                ) : (
                  <span className="text-muted-foreground/30 font-bold">?</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
        Simple Classic Snakes & Ladders
      </p>
    </div>
  );
}
