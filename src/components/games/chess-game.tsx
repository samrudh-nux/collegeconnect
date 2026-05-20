
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Chess,
  Square,
  PieceSymbol,
} from "chess.js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Volume2, VolumeX, Timer, Brain, ShieldAlert } from "lucide-react";

const pieceUnicode: Record<PieceSymbol, string> = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
};

type Difficulty = "easy" | "medium" | "hard";
type GameMode = "pvp" | "pva" | null;
type PlayerColor = "w" | "b";

// --- Advanced AI Logic ---
const pieceValue: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional bonuses (encourages central control and development)
const pst: Record<PieceSymbol, number[][]> = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

const evaluateBoard = (game: Chess): number => {
  let totalEvaluation = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = pieceValue[piece.type];
        const pos = piece.color === 'w' ? pst[piece.type][i][j] : pst[piece.type][7 - i][j];
        totalEvaluation += (piece.color === "w" ? (val + pos) : -(val + pos));
      }
    }
  }
  return totalEvaluation;
};

const minimax = (
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): number => {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves();

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalMove = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalMove);
      alpha = Math.max(alpha, evalMove);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalMove = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalMove);
      beta = Math.min(beta, evalMove);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const getBestMove = (game: Chess, difficulty: Difficulty): string | null => {
  const moves = game.moves();
  if (moves.length === 0) return null;

  // Easy mode makes random moves 40% of the time
  if (difficulty === "easy" && Math.random() < 0.4) {
      return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = null;
  let bestValue = game.turn() === "w" ? -Infinity : Infinity;
  const depth = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -Infinity, Infinity, game.turn() === "b");
    game.undo();

    if (game.turn() === "w") {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
  }
  return bestMove || moves[Math.floor(Math.random() * moves.length)];
};

const INITIAL_TIME = 600; // 10 minutes

export default function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Square[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  // Timer states
  const [timers, setTimers] = useState({ w: INITIAL_TIME, b: INITIAL_TIME });
  const [gameStarted, setGameStarted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3");
    audio.loop = true;
    audio.volume = 0.12;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (gameMode && !isMuted) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [gameMode, isMuted]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !game.isGameOver()) {
      interval = setInterval(() => {
        const turn = game.turn();
        setTimers(prev => ({
          ...prev,
          [turn]: Math.max(0, prev[turn] - 1)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, game]);

  const winner = useMemo(() => {
    if (timers.w <= 0) return "Black (Time)";
    if (timers.b <= 0) return "White (Time)";
    if (!game.isGameOver()) return null;
    if (game.isCheckmate()) return game.turn() === "w" ? "Black" : "White";
    if (game.isDraw()) return "Draw";
    return "Game Over";
  }, [game, timers]);

  const getMoveOptions = (square: Square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares([]);
      return false;
    }
    setOptionSquares(moves.map((m) => m.to));
    return true;
  };

  const safeGameMutate = (modify: (g: Chess) => void) => {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  };

  const handleSquareClick = (square: Square) => {
    if (winner || (gameMode === "pva" && game.turn() !== playerColor)) return;

    if (selectedSquare) {
      const moveOptions = game.moves({ square: selectedSquare, verbose: true });
      const move = moveOptions.find((m) => m.to === square);

      if (move) {
        safeGameMutate((g) => {
          g.move({ from: selectedSquare, to: square, promotion: "q" });
        });
        if (!gameStarted) setGameStarted(true);
        setMoveHistory((prev) => [...prev, `${selectedSquare}-${square}`]);
        setSelectedSquare(null);
        setOptionSquares([]);
        return;
      } else {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          getMoveOptions(square);
          return;
        }
        setSelectedSquare(null);
        setOptionSquares([]);
      }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        getMoveOptions(square);
      }
    }
  };

  const makeAIMove = useCallback(() => {
    const aiColor = playerColor === "w" ? "b" : "w";
    if (winner || game.turn() !== aiColor) return;
    setAiIsThinking(true);

    setTimeout(() => {
      const bestMove = getBestMove(game, difficulty);
      if (bestMove) {
        safeGameMutate((g) => {
          g.move(bestMove);
        });
        if (!gameStarted) setGameStarted(true);
        setMoveHistory((prev) => [...prev, bestMove]);
      }
      setAiIsThinking(false);
    }, 600);
  }, [game, playerColor, winner, difficulty, gameStarted]);

  useEffect(() => {
    if (gameMode === "pva" && !winner) {
      const aiColor = playerColor === "w" ? "b" : "w";
      if (game.turn() === aiColor && !aiIsThinking) {
        makeAIMove();
      }
    }
  }, [game, gameMode, playerColor, winner, makeAIMove, aiIsThinking]);

  const startNewGame = (mode: GameMode, color: PlayerColor = "w", diff: Difficulty = "medium") => {
    const newGame = new Chess();
    setGame(newGame);
    setGameMode(mode);
    setPlayerColor(color);
    setDifficulty(diff);
    setSelectedSquare(null);
    setOptionSquares([]);
    setMoveHistory([]);
    setTimers({ w: INITIAL_TIME, b: INITIAL_TIME });
    setGameStarted(false);

    if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {});

    if (mode === "pva" && color === "b") {
      setAiIsThinking(true);
      setTimeout(() => {
        const move = getBestMove(newGame, diff);
        if (move) {
          safeGameMutate((g) => g.move(move));
          setMoveHistory([move]);
          setGameStarted(true);
        }
        setAiIsThinking(false);
      }, 800);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderBoard = () => {
    const squares = [];
    const boardData = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const squareName = (String.fromCharCode(97 + j) + (8 - i)) as Square;
        const piece = boardData[i][j];
        const isLight = (i + j) % 2 === 0;
        const isSelected = selectedSquare === squareName;
        const isOption = optionSquares.includes(squareName);
        const lastMove = moveHistory[moveHistory.length - 1];
        const isLastMove = lastMove?.includes(squareName);

        squares.push(
          <div
            key={squareName}
            onClick={() => handleSquareClick(squareName)}
            className={cn(
              "relative flex items-center justify-center w-full h-full cursor-pointer transition-none",
              isLight ? "bg-[#ebecd0]" : "bg-[#779556]",
              isSelected && "bg-[#f6f669]",
              isLastMove && !isSelected && "bg-[#f6f669]/60"
            )}
          >
            {isOption && (
              <div className={cn(
                "absolute rounded-full z-10",
                piece ? "w-[80%] h-[80%] border-4 border-black/10" : "w-4 h-4 bg-black/10"
              )} />
            )}
            {piece && (
              <span className={cn(
                "text-4xl sm:text-5xl leading-none select-none z-20 transition-transform active:scale-95",
                piece.color === 'w' 
                  ? "text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
                  : "text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.2)]"
              )}>
                {pieceUnicode[piece.type]}
              </span>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  if (!gameMode) {
    return (
      <Card className="w-full max-w-xl border-none shadow-none bg-transparent animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center p-0 mb-8">
          <CardTitle className="text-3xl font-black italic tracking-tighter text-primary">GRANDMASTER ARENA</CardTitle>
          <p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.2em] mt-2">Select Your Challenge</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Local Match</span>
              </div>
              <Button variant="outline" size="lg" className="w-full h-16 text-lg font-black border-2 hover:bg-primary hover:text-white transition-all shadow-lg" onClick={() => startNewGame("pvp")}>
                PLAYER VS PLAYER
              </Button>
          </div>

          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI Combat Engine</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                      <Button 
                        key={diff}
                        variant={difficulty === diff ? "secondary" : "outline"} 
                        onClick={() => setDifficulty(diff)}
                        className={cn(
                            "h-12 font-black uppercase tracking-tighter text-xs border-2",
                            difficulty === diff && "border-primary ring-2 ring-primary/20"
                        )}
                      >
                        {diff}
                      </Button>
                  ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-slate-100 transition-all shadow-md group" onClick={() => startNewGame("pva", "w", difficulty)}>
                  <div className="w-6 h-6 rounded bg-white border-2 border-slate-300 shadow-sm group-hover:scale-110 transition-transform" />
                  <span className="font-black italic text-xs uppercase">PLAY AS WHITE</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:bg-slate-100 transition-all shadow-md group" onClick={() => startNewGame("pva", "b", difficulty)}>
                  <div className="w-6 h-6 rounded bg-slate-900 border-2 border-slate-700 shadow-sm group-hover:scale-110 transition-transform" />
                  <span className="font-black italic text-xs uppercase">PLAY AS BLACK</span>
                </Button>
              </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-8 w-full max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      <div className="flex flex-col items-center w-full max-w-[540px]">
        {/* Opponent Timer */}
        <div className="w-full mb-4 flex items-center justify-between px-2 bg-card/50 p-2 rounded-xl border-2 border-border/50">
            <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black", game.turn() === (playerColor === 'w' ? 'b' : 'w') ? 'bg-primary text-white animate-pulse' : 'bg-muted')}>
                    {gameMode === 'pva' ? <Brain className="h-5 w-5" /> :PieceUnicode[game.turn()]}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opponent</span>
                    <span className="text-xs font-bold">{gameMode === 'pva' ? `AI (${difficulty.toUpperCase()})` : 'Player 2'}</span>
                </div>
            </div>
            <div className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 font-mono text-2xl font-black transition-colors shadow-inner",
                game.turn() === (playerColor === 'w' ? 'b' : 'w') ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/50 border-border text-muted-foreground'
            )}>
                <Timer className="h-5 w-5" />
                {formatTime(playerColor === 'w' ? timers.b : timers.w)}
            </div>
        </div>

        <div 
          className="aspect-square w-full border-8 border-[#312e2b] grid grid-cols-8 grid-rows-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden bg-[#312e2b]"
          style={{ gridTemplateRows: 'repeat(8, minmax(0, 1fr))' }}
        >
          {renderBoard()}
        </div>
        
        {/* Player Timer */}
        <div className="w-full mt-4 flex items-center justify-between px-2 bg-card p-2 rounded-xl border-2 border-border">
            <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black", game.turn() === playerColor ? 'bg-primary text-white animate-pulse' : 'bg-muted')}>
                    {playerColor === 'w' ? 'W' : 'B'}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Time</span>
                    <span className="text-xs font-bold">You (White)</span>
                </div>
            </div>
            <div className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 font-mono text-2xl font-black transition-colors shadow-inner",
                game.turn() === playerColor ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/50 border-border text-muted-foreground'
            )}>
                <Timer className="h-5 w-5" />
                {formatTime(playerColor === 'w' ? timers.w : timers.b)}
            </div>
        </div>

        <div className="mt-8 flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="rounded-full h-12 w-12 hover:bg-muted shadow-sm">
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
            <div className="flex gap-3">
              <Button onClick={() => setGameMode(null)} variant="outline" className="px-8 font-black uppercase italic tracking-tighter border-2">MENU</Button>
              <Button onClick={() => startNewGame(gameMode, playerColor, difficulty)} variant="secondary" className="px-8 font-black uppercase italic tracking-tighter border-2">RESTART</Button>
            </div>
        </div>
      </div>

      <Card className="w-full xl:w-80 h-full min-h-[500px] flex flex-col border-none shadow-2xl bg-card/50 backdrop-blur-md">
        <CardHeader className="py-4 border-b bg-muted/20">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" /> GAME ANALYSIS
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          {winner && (
              <div className="p-6 bg-primary/10 text-center animate-in slide-in-from-top duration-500 border-b border-primary/20">
                  <Trophy className="h-10 w-10 text-primary mx-auto mb-2 animate-bounce" />
                  <h3 className="text-2xl font-black italic tracking-tighter text-primary">
                    {winner === "Draw" ? "MATCH DRAWN" : `${winner.toUpperCase()} VICTORIOUS`}
                  </h3>
              </div>
          )}
          
          <ScrollArea className="flex-1 px-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-6">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                <div key={i} className="contents text-xs">
                  <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground w-6 text-right font-black opacity-30 italic">{i + 1}.</span>
                    <span className="font-black bg-muted px-3 py-1 rounded-md shadow-sm border border-border/50 uppercase italic tracking-tighter">{moveHistory[i * 2]}</span>
                  </div>
                  <div className="flex items-center">
                    {moveHistory[i * 2 + 1] && (
                      <span className="font-black bg-muted px-3 py-1 rounded-md shadow-sm border border-border/50 uppercase italic tracking-tighter">{moveHistory[i * 2 + 1]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {moveHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-20">
                <Timer className="h-12 w-12" />
                <p className="font-black italic text-sm tracking-tighter">WAITING FOR OPENING MOVE</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 bg-muted/30 border-t">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  <span>Engine Status</span>
                  <span>v4.2 PRO</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full bg-primary transition-all duration-1000", aiIsThinking ? "w-full animate-pulse" : "w-0")} />
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const PieceUnicode: Record<string, string> = {
    'w': 'W',
    'b': 'B'
};
const Trophy = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V18"/><path d="M14 22V18"/><path d="M18 4H6v7a6 6 0 0 0 12 0V4Z"/></svg>
);
