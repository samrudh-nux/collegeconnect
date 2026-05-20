"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useFirestore, useUser, updateDocumentNonBlocking } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, RefreshCw, CheckCircle2, Search, Sparkles, Ghost, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type VibeType = 'anime' | 'cartoons' | '3d' | 'digital';

export default function AvatarSelectionPage() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [activeVibe, setActiveVibe] = useState<VibeType>('anime');
  const [matrixSeed, setMatrixSeed] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  const personaSets = useMemo(() => {
    const getAvatars = (style: string, count: number) => 
      Array.from({ length: count }, (_, i) => 
        `https://api.dicebear.com/9.x/${style}/svg?seed=${i + matrixSeed}${searchTerm ? '-' + searchTerm : ''}`
      );

    return {
      anime: getAvatars('adventurer', 12),
      cartoons: getAvatars('bottts', 12),
      '3d': getAvatars('avataaars', 12),
      digital: getAvatars('pixel-art', 12),
    };
  }, [matrixSeed, searchTerm]);

  const handleContinue = async () => {
    if (!selectedAvatar || !user || !db) {
      toast({
        variant: "destructive",
        title: "Identity Required",
        description: "Please select a digital persona to proceed.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Update Firebase Auth Profile for session consistency
      await updateProfile(user, { photoURL: selectedAvatar });
      
      // 2. Update Firestore User Profile for persistent storage
      const userDocRef = doc(db, "userProfiles", user.uid);
      const updateData = { profileImageUrl: selectedAvatar };
      updateDocumentNonBlocking(userDocRef, updateData);

      toast({
        title: "Identity Synchronized! 🚀",
        description: "Your digital persona is now locked across the network.",
        duration: 3000,
      });
      
      router.push("/feed");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to broadcast identity to network.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleMatrix = () => {
    setMatrixSeed(prev => prev + 12);
    setSelectedAvatar(null);
    toast({ title: "Matrix Re-Synced!", description: "New digital shards generated." });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl animate-in fade-in duration-700">
      <Suspense fallback={null}>
        <WelcomeDialog />
      </Suspense>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* PREVIEW SHARD */}
        <Card className="w-full lg:w-[400px] border-none shadow-3xl bg-card/40 backdrop-blur-2xl overflow-hidden rounded-[3rem] shrink-0 ring-1 ring-white/20">
          <div className="h-48 w-full bg-gradient-to-br from-primary via-accent to-purple-600 relative">
             <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                <svg width="100%" height="100%"><defs><pattern id="grid-avatar" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid-avatar)" /></svg>
             </div>
             <div className="absolute top-6 left-6">
                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Identity Shard v3.0
                </div>
             </div>
          </div>
          <CardContent className="flex flex-col items-center -mt-24 pb-12 relative px-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse-soft" />
              <Avatar className="h-56 w-56 border-[12px] border-background shadow-2xl transition-all duration-700 group-hover:scale-105 relative z-10">
                <AvatarImage src={selectedAvatar || ""} className="bg-muted/10 p-2" />
                <AvatarFallback className="bg-muted text-muted-foreground/20">
                  <Ghost className="h-24 w-24" />
                </AvatarFallback>
              </Avatar>
              {selectedAvatar && (
                <div className="absolute bottom-6 right-6 bg-green-500 p-3 rounded-full border-4 border-background animate-in zoom-in duration-300 z-20 shadow-xl">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            
            <div className="text-center mt-10 space-y-4">
              <h3 className="text-4xl font-black italic tracking-tighter uppercase text-foreground drop-shadow-sm">
                {user.email?.split('@')[0] || "New Recruit"}
              </h3>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] bg-primary/5 px-6 py-2 rounded-full border border-primary/10 inline-block">
                Digital Presence Ready
              </p>
              
              {!selectedAvatar && (
                <p className="text-xs font-medium text-muted-foreground italic px-6 mt-6 leading-relaxed opacity-70">
                  Search or discover your digital persona from the matrix to finalize your professional onboarding.
                </p>
              )}
            </div>

            <Button
                onClick={handleContinue}
                className="w-full mt-12 h-20 text-2xl font-black italic uppercase tracking-tighter shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 rounded-[2rem] bg-gradient-to-r from-primary to-accent"
                disabled={isLoading || !selectedAvatar}
            >
                {isLoading ? <Loader2 className="mr-3 h-8 w-8 animate-spin" /> : <Zap className="mr-3 h-8 w-8" />}
                Sync Identity
            </Button>
          </CardContent>
        </Card>

        {/* MATRIX HUB */}
        <Card className="flex-1 border-none shadow-3xl bg-card/30 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-white/10 min-h-[800px]">
          <CardHeader className="bg-muted/40 border-b p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  <CardTitle className="text-5xl font-black italic tracking-tighter uppercase leading-none">Persona Matrix</CardTitle>
                </div>
                <CardDescription className="font-bold uppercase tracking-widest text-xs text-muted-foreground/80 ml-1">
                  Discover your academic and digital brand in the multiverse.
                </CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={shuffleMatrix} className="h-16 w-16 rounded-[1.5rem] border-2 hover:bg-primary hover:text-white transition-all shadow-xl active:rotate-180 duration-500 bg-background/50">
                <RefreshCw className="h-8 w-8" />
              </Button>
            </div>
            
            <div className="mt-10 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/50" />
              <Input 
                placeholder="Search styles (e.g. Ninja, Robot, Hero, Mage)..." 
                className="pl-16 h-16 bg-background/50 border-2 rounded-[1.5rem] font-black uppercase tracking-tight focus:border-primary transition-all text-lg shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-12 space-y-12">
            <Tabs defaultValue="anime" onValueChange={(v) => setActiveVibe(v as VibeType)} className="w-full">
              <TabsList className="bg-muted/50 p-2 border-2 h-20 rounded-[1.5rem] mb-12 w-full justify-start gap-3 overflow-x-auto">
                <TabsTrigger value="anime" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter px-10 text-xs rounded-xl h-full transition-all">
                  Anime Elites
                </TabsTrigger>
                <TabsTrigger value="cartoons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter px-10 text-xs rounded-xl h-full transition-all">
                  Cartoon Punks
                </TabsTrigger>
                <TabsTrigger value="3d" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter px-10 text-xs rounded-xl h-full transition-all">
                  3D Avatars
                </TabsTrigger>
                <TabsTrigger value="digital" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter px-10 text-xs rounded-xl h-full transition-all">
                  Digital Shards
                </TabsTrigger>
              </TabsList>

              {Object.entries(personaSets).map(([vibe, avatars]) => (
                <TabsContent key={vibe} value={vibe} className="mt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-8">
                    {avatars.map((url, i) => (
                      <div 
                        key={i} 
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedAvatar(url)}
                      >
                        <div className={cn(
                          "relative rounded-[2rem] overflow-hidden border-4 transition-all duration-500 group-hover:scale-110 shadow-xl",
                          selectedAvatar === url ? "border-primary ring-8 ring-primary/20 scale-110 shadow-2xl" : "border-transparent bg-muted/20"
                        )}>
                          <img src={url} alt={`Avatar ${i}`} className="w-full h-auto p-2" />
                          {selectedAvatar === url && (
                             <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                          )}
                        </div>
                        {selectedAvatar === url && (
                           <div className="absolute -top-3 -right-3 bg-primary text-white p-1.5 rounded-full shadow-2xl z-10 border-4 border-background animate-in zoom-in">
                              <CheckCircle2 className="h-5 w-5" />
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="p-10 rounded-[3rem] bg-primary/[0.03] border-4 border-dashed border-primary/10 flex flex-col sm:flex-row items-center gap-8">
                <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Ghost className="h-10 w-10 text-primary animate-bounce-slow" />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                      All digital personas are <span className="text-primary italic underline decoration-primary/30 underline-offset-4">Vector-Optimized</span> for high-fidelity cross-platform rendering.
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.4em]">
                      Custom shard uploads have been deprecated in favor of Matrix search and generation.
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}