"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase, 
  errorEmitter, 
  FirestorePermissionError 
} from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Medal, Star, Gamepad2, Loader2, ShieldCheck, ChevronRight, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/firestore";

const CORE_WHITELIST = ["SAM123", "JESSE", "YUZII", "LISA123"];

const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 1) return <Award className="h-6 w-6 text-slate-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-amber-700" />;
    return <Star className="h-6 w-6 text-muted-foreground" />;
}

export default function LeaderboardPage() {
  const [challenging, setChallenging] = useState<Record<string, boolean>>({});
  const { user: currentUser, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const leaderboardQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !currentUser) return null;
    return query(
      collection(db, "userProfiles"),
      orderBy("highScore", "desc"),
      limit(50) 
    );
  }, [db, currentUser, isUserLoading]);

  const { data: rawLeaderboard, isLoading } = useCollection<UserProfile>(leaderboardQuery);

  const leaderboard = rawLeaderboard?.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toUpperCase();
    const email = (p.email || '').toUpperCase();
    const id = p.id;
    
    const isCore = CORE_WHITELIST.some(w => 
        fullName.includes(w.toUpperCase()) || 
        id.includes(w) || 
        email.includes(w.toUpperCase())
    );
    
    return isCore || p.id === currentUser?.uid;
  });

  const handleChallenge = async (targetUser: UserProfile) => {
    if (!currentUser || !db) return;
    
    setChallenging(prev => ({ ...prev, [targetUser.id]: true }));

    const gameRequestData = {
        requesterId: currentUser.uid,
        requesterEmail: currentUser.email || 'Anonymous',
        recipientId: targetUser.id,
        recipientEmail: targetUser.email,
        gameId: 'chess',
        status: 'pending',
        requestedAt: serverTimestamp(),
    };
    const gameRequestsCollection = collection(db, "gameRequests");
    
    addDoc(gameRequestsCollection, gameRequestData)
        .then(() => {
            toast({
                title: "Challenge Sent!",
                description: `Your game challenge has been sent to ${targetUser.firstName}.`,
            });
        })
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: gameRequestsCollection.path,
                operation: 'create',
                requestResourceData: gameRequestData,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setChallenging(prev => ({ ...prev, [targetUser.id]: false }));
        });
  };

  const handleViewProfile = (userId: string) => {
    if (userId === currentUser?.uid) {
        router.push('/profile');
    } else {
        router.push(`/profile/${userId}`);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto animate-in fade-in duration-700 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 shadow-inner">
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Hall of Fame</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] ml-1.5 mt-2">Verified Elite Network</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/20">
           <ShieldCheck className="h-4 w-4 text-primary" />
           <span className="text-[9px] font-black uppercase tracking-widest text-primary">Core Protocol Active</span>
        </div>
      </div>

      <Card className="shadow-2xl border-none bg-card/50 backdrop-blur-md overflow-hidden rounded-[2.5rem] ring-1 ring-white/10">
        <CardHeader className="bg-muted/30 border-b p-8">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-black italic uppercase tracking-tight">Arena Standings</CardTitle>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Rankings</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-32 gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest animate-pulse">Syncing Rankings...</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((user, index) => (
                  <li key={user.id} className={cn(
                      "flex items-center justify-between p-6 transition-all hover:bg-primary/[0.04] group cursor-pointer",
                      user.id === currentUser?.uid && "bg-primary/[0.04]"
                  )} onClick={() => handleViewProfile(user.id)}>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-2xl w-10 text-center text-muted-foreground/30 italic">#{index + 1}</span>
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-4 border-background shadow-xl transition-transform group-hover:scale-110">
                          <AvatarImage src={user.profileImageUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.id}`} />
                          <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                            <Ghost className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                            <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-lg ring-1 ring-border">
                                {getRankIcon(index)}
                            </div>
                        )}
                      </div>
                      <div>
                        <div className="font-black text-lg uppercase tracking-tight flex items-center gap-3 group-hover:text-primary transition-colors">
                          {`${user.firstName} ${user.lastName}`.trim()}
                          {user.id === currentUser?.uid && <Badge variant="secondary" className="bg-primary text-white text-[9px] font-black h-5 uppercase px-2">Operator</Badge>}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{user.collegeName || "Elite Student"}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-tight opacity-40">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Combat Score</p>
                          <p className="text-4xl font-black italic tracking-tighter text-primary">{user.highScore}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {currentUser && user.id !== currentUser.uid && (
                           <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleChallenge(user);
                                }}
                                disabled={challenging[user.id]}
                                className="w-32 hidden sm:flex h-12 rounded-xl border-2 font-black italic uppercase tracking-tighter transition-all hover:bg-primary hover:text-white"
                            >
                                {challenging[user.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Gamepad2 className="mr-2 h-4 w-4" />
                                        Challenge
                                    </>
                                )}
                            </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="p-40 text-center flex flex-col items-center gap-6 animate-in fade-in duration-1000">
                    <div className="h-24 w-24 bg-muted/20 rounded-full flex items-center justify-center opacity-30 shadow-inner">
                        <Star className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                        <p className="font-black italic text-2xl uppercase tracking-tighter text-muted-foreground">The Arena is Quiet</p>
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.4em]">Initialize competitive protocols to rank</p>
                    </div>
                </div>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-10 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/10 bg-primary/[0.01] flex items-center gap-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center flex-shrink-0">
             <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
             The Hall of Fame is a <span className="text-primary font-black italic">Protected Shard</span>. Rankings are strictly moderated to ensure the integrity of the verified student core.
          </p>
      </div>
    </div>
  );
}
