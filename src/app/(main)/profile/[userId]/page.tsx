"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, serverTimestamp, setDoc, addDoc, collection } from "firebase/firestore";
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Gamepad, Star, School, Sparkles, MessageSquare, Gamepad2, ArrowLeft, Loader2, UserCircle, MapPin, Mail, Calendar, Ghost } from "lucide-react";
import type { UserProfile } from "@/types/firestore";

const getBadges = (score: number) => {
    const badges = [];
    if(score >= 10) badges.push({name: "Rookie", icon: <Star className="h-4 w-4"/>});
    if(score >= 50) badges.push({name: "Pro Gamer", icon: <Gamepad className="h-4 w-4"/>});
    if(score >= 100) badges.push({name: "Master", icon: <Award className="h-4 w-4"/>});
    return badges;
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !userId) return;
    
    const userDocRef = doc(db, "userProfiles", userId);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
      }));
    });
    
    return () => unsub();
  }, [db, userId]);

  const handleMessagePeer = async () => {
    if (!currentUser || !db || !profile) return;
    setActionLoading(prev => ({ ...prev, message: true }));

    const conversationId = [currentUser.uid, profile.id].sort().join('_');
    const convRef = doc(db, "chatConversations", conversationId);

    const chatData = {
      id: conversationId,
      participantIds: [currentUser.uid, profile.id],
      type: "one-to-one" as const,
      createdAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
      adminId: currentUser.uid,
    };

    setDoc(convRef, chatData, { merge: true })
      .then(() => {
        router.push(`/chat?id=${conversationId}`);
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: convRef.path,
          operation: 'write',
          requestResourceData: chatData,
        }));
      })
      .finally(() => {
        setActionLoading(prev => ({ ...prev, message: false }));
      });
  };

  const handleChallenge = async () => {
    if (!currentUser || !db || !profile) return;
    setActionLoading(prev => ({ ...prev, challenge: true }));
    
    const gameRequestData = {
        requesterId: currentUser.uid,
        requesterEmail: currentUser.email || 'Anonymous',
        recipientId: profile.id,
        recipientEmail: profile.email,
        gameId: 'chess',
        status: 'pending',
        requestedAt: serverTimestamp(),
    }
    const gameRequestsCollection = collection(db, "gameRequests");

    addDoc(gameRequestsCollection, gameRequestData)
      .then(() => {
        toast({
          title: "Challenge Sent!",
          description: `Your game challenge has been sent to ${profile.firstName}.`,
        });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: gameRequestsCollection.path,
            operation: 'create',
            requestResourceData: gameRequestData,
        }));
      })
      .finally(() => {
        setActionLoading(prev => ({ ...prev, challenge: false }));
      });
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Card className="border-none shadow-3xl bg-card/50">
          <Skeleton className="h-48 w-full rounded-t-[2.5rem]" />
          <CardHeader className="flex flex-col sm:flex-row items-center gap-8 p-8 -mt-20">
            <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
            <div className="space-y-4 flex-1 mt-10">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <Skeleton className="h-32 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto text-center py-20">
        <div className="bg-primary/5 p-10 rounded-full inline-block mb-6">
            <UserCircle className="h-20 w-20 text-muted-foreground/30" />
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-muted-foreground">User Protocol Not Found</h1>
        <Button variant="link" onClick={() => router.back()} className="mt-4 font-bold uppercase tracking-widest text-xs">Return to Network</Button>
      </div>
    );
  }

  const badges = getBadges(profile.highScore);
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="container mx-auto animate-in fade-in duration-700 pb-20 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-8 font-black uppercase italic tracking-widest text-[10px] gap-2 hover:bg-primary/5 transition-all"
      >
        <ArrowLeft className="h-3 w-3" /> ABORT AND RETURN
      </Button>

      <Card className="border-none shadow-3xl bg-card/50 backdrop-blur-md overflow-hidden rounded-[2.5rem] ring-1 ring-white/10">
        {/* LinkedIn-Style Banner */}
        <div className="h-48 w-full bg-gradient-to-r from-primary via-primary/80 to-accent relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
            <div className="absolute top-6 right-8">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 font-black italic uppercase tracking-widest text-[9px] px-4 py-1.5">
                   Verified Student Shard
                </Badge>
            </div>
        </div>

        <CardHeader className="px-8 pb-4 flex flex-col sm:flex-row items-center sm:items-end gap-8 -mt-20">
          <div className="relative group">
            <Avatar className="h-40 w-40 border-8 border-background shadow-2xl ring-1 ring-black/5">
              <AvatarImage src={profile.profileImageUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${profile.id}`} />
              <AvatarFallback className="text-5xl font-black bg-muted">
                  <Ghost className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 bg-green-500 h-6 w-6 rounded-full border-4 border-background" />
          </div>
          
          <div className="text-center sm:text-left space-y-3 flex-1 mb-2">
            <div>
              <CardTitle className="text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none">{displayName}</CardTitle>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                 <div className="flex items-center gap-1.5 text-primary">
                    <School className="h-3.5 w-3.5" /> {profile.collegeName || "Independent Elite"}
                 </div>
                 <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Global Network
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {profile.email}
                 </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {profile.interests && profile.interests.length > 0 ? (
                    profile.interests.map((interest, i) => (
                      <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase tracking-widest px-3 py-1">
                        #{interest}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground/40 italic">NO INTERESTS LOGGED</span>
                  )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-12">
          {/* Quick Action Deck (WhatsApp-style utility) */}
          <div className="grid grid-cols-2 gap-4">
                <Button 
                    onClick={handleMessagePeer} 
                    disabled={actionLoading.message}
                    className="h-16 text-xl font-black italic uppercase tracking-tighter gap-3 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                >
                    {actionLoading.message ? <Loader2 className="h-6 w-6 animate-spin" /> : <MessageSquare className="h-6 w-6" />} INITIATE CHAT
                </Button>
                <Button 
                    onClick={handleChallenge} 
                    disabled={actionLoading.challenge}
                    variant="outline"
                    className="h-16 text-xl font-black italic uppercase tracking-tighter gap-3 border-2 hover:bg-muted rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
                >
                    {actionLoading.challenge ? <Loader2 className="h-6 w-6 animate-spin" /> : <Gamepad2 className="h-6 w-6" />} CHALLENGE PEER
                </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">
                        <Sparkles className="h-3 w-3 text-primary" /> Identity Briefing
                    </div>
                    <div className="text-base font-medium leading-relaxed text-foreground/80 italic bg-muted/20 p-8 rounded-3xl border-2 border-dashed border-border/50 shadow-inner">
                        {profile.bio || "This high-capacity student has not yet transmitted their briefing to the network ledger."}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">
                        <Award className="h-3 w-3 text-primary" /> Merit Badges
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {badges.length > 0 ? (
                            badges.map((badge, index) => (
                                <div key={index} className="flex items-center gap-4 bg-card p-5 rounded-2xl border-2 border-border/50 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/20 group">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                                        {badge.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black italic uppercase tracking-tighter text-sm">{badge.name}</span>
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Verified Rank</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full py-16 flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] opacity-30 text-center gap-4 bg-muted/10">
                                <Award className="h-12 w-12" />
                                <div className="space-y-1">
                                    <p className="font-black italic uppercase tracking-tighter">No badges earned</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Arena performance...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-primary/5 p-8 rounded-[2.5rem] border-2 border-primary/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 bg-primary/5 h-32 w-32 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                        <Gamepad className="h-3.5 w-3.5" /> Arena Score
                    </h3>
                    <p className="text-7xl font-black italic tracking-tighter text-primary drop-shadow-md">{profile.highScore}</p>
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] mt-2">Combat Readiness: High</p>
                </div>

                <Card className="rounded-[2.5rem] bg-muted/30 border-none shadow-inner overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" /> Network Metadata
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                            <span className="text-muted-foreground/60">Rank</span>
                            <span className="text-foreground">{badges.length > 0 ? badges[badges.length - 1].name : "INITIATE"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                            <span className="text-muted-foreground/60">Status</span>
                            <span className="flex items-center gap-1.5 text-green-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                Transmitting
                            </span>
                        </div>
                        <div className="pt-4 border-t border-border/50">
                            <p className="text-[9px] font-medium italic text-muted-foreground/50 text-center leading-relaxed">
                                This identity is cryptographically verified on the CollegeConnect Network Ledger.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
