
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, writeBatch, getDocs, where } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useAuth, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Award, Gamepad, Star, Loader2, Edit3, Save, School, Sparkles, Hash, ShieldAlert, Zap, UserX, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, GlobalFeedMessage } from "@/types/firestore";

const CORE_WHITELIST = ["SAM123", "JESSE", "YUZII", "LISA123"];

const getBadges = (score: number) => {
    const badges = [];
    if(score >= 10) badges.push({name: "Rookie", icon: <Star className="h-4 w-4"/>});
    if(score >= 50) badges.push({name: "Pro Gamer", icon: <Gamepad className="h-4 w-4"/>});
    if(score >= 100) badges.push({name: "Master", icon: <Award className="h-4 w-4"/>});
    return badges;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  
  // Edit Form State
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editInterests, setEditInterests] = useState("");

  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = user?.email === "jayrobin@gmail.com" || user?.email === "admin@collegeconnect.edu";

  // Fetch all profiles for Admin Management
  const allProfilesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return collection(db, "userProfiles");
  }, [db, isAdmin]);
  const { data: allProfiles } = useCollection<UserProfile>(allProfilesQuery);

  useEffect(() => {
    if (user && db) {
      const userDocRef = doc(db, "userProfiles", user.uid);
      const unsub = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProfile;
          setProfile(data);
          setEditFirstName(data.firstName || "");
          setEditLastName(data.lastName || "");
          setEditCollege(data.collegeName || "");
          setEditBio(data.bio || "");
          setEditInterests(data.interests?.join(", ") || "");
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
    } else if (!user) {
        setLoading(false);
    }
  }, [user, db]);

  const handleUpdateProfile = () => {
    if (!user || !db) return;
    setEditLoading(true);

    const userDocRef = doc(db, "userProfiles", user.uid);
    const interestsArray = editInterests.split(",").map(i => i.trim()).filter(i => i.length > 0);
    
    const updateData = {
      firstName: editFirstName,
      lastName: editLastName,
      collegeName: editCollege,
      bio: editBio,
      interests: interestsArray,
    };

    updateDoc(userDocRef, updateData)
      .then(() => {
        toast({ title: "Identity Verified! 🚀", description: "Profile synchronized." });
        setIsEditing(false);
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      })
      .finally(() => {
        setEditLoading(false);
      });
  };

  const handlePurgeUnverifiedIdentities = async () => {
    if (!db || !allProfiles) return;
    setIsPurging(true);

    const batch = writeBatch(db);
    let count = 0;

    const victims = allProfiles.filter(p => {
        const name = `${p.firstName} ${p.lastName}`.toUpperCase();
        const id = p.id;
        const email = p.email.toUpperCase();
        
        const isCore = CORE_WHITELIST.some(w => 
            name.includes(w.toUpperCase()) || 
            id.includes(w) || 
            email.includes(w.toUpperCase())
        );
        
        return !isCore && id !== user?.uid;
    });

    try {
        // 1. Delete Profiles and associated activities in batches
        for (const victim of victims) {
            batch.delete(doc(db, "userProfiles", victim.id));
            count++;
            
            // Cleanup game requests
            const gameQuery = query(collection(db, "gameRequests"), where("requesterId", "==", victim.id));
            const gameDocs = await getDocs(gameQuery);
            gameDocs.forEach(d => batch.delete(d.ref));

            // Cleanup join requests
            const reqQuery = query(collection(db, "groupJoinRequests"), where("requesterId", "==", victim.id));
            const reqDocs = await getDocs(reqQuery);
            reqDocs.forEach(d => batch.delete(d.ref));
        }

        // 2. Delete Global Feed Messages from victims
        const feedQuery = query(collection(db, "globalFeedMessages"));
        const feedDocs = await getDocs(feedQuery);
        feedDocs.forEach(msgDoc => {
            const data = msgDoc.data() as GlobalFeedMessage;
            if (victims.some(v => v.id === data.authorId)) {
                batch.delete(msgDoc.ref);
            }
        });

        await batch.commit();
        toast({
            title: "Identity Purge Complete! ⚡",
            description: `Permanently erased ${count} unauthorized student identities and their data footprints.`,
        });
    } catch (error) {
        toast({ variant: "destructive", title: "Purge Failed", description: "Critical error in cleanup protocol." });
    } finally {
        setIsPurging(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user || !db || !auth) return;
    setIsDeleting(true);
    const userDocRef = doc(db, "userProfiles", user.uid);

    deleteDoc(userDocRef)
      .then(async () => {
        try {
          await deleteUser(user);
          router.push("/login");
        } catch (authError: any) {
          if (authError.code === 'auth/requires-recent-login') {
            toast({ variant: "destructive", title: "Re-auth required", description: "Please logout and login again to delete." });
            await auth.signOut();
            router.push("/login");
          }
        }
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userDocRef.path, operation: 'delete' }));
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  if (loading) return <div className="container mx-auto p-12 text-center"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" /></div>;
  if (!profile) return <div className="p-12 text-center font-black uppercase italic">Identity Lost. Please Re-authenticate.</div>;

  const badges = getBadges(profile.highScore);
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="container mx-auto animate-in fade-in duration-700 pb-20 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Command Profile</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] ml-1">Verified Identity</p>
          </div>
        </div>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button className="font-black italic uppercase tracking-tighter gap-2 h-12 shadow-xl shadow-primary/20 transition-all hover:scale-105">
              <Edit3 className="h-4 w-4" /> Modify Identity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] h-[85vh] flex flex-col p-0 border-none shadow-2xl overflow-hidden rounded-[2rem]">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
              <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase">Edit Professional Identity</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-bold uppercase tracking-widest text-[10px]">
                Update your credentials visible to the global network.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</Label>
                  <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="h-12 font-bold uppercase tracking-tight" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</Label>
                  <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="h-12 font-bold uppercase tracking-tight" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">College / University</Label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input value={editCollege} onChange={(e) => setEditCollege(e.target.value)} placeholder="University Name" className="h-12 pl-10 font-bold uppercase tracking-tight" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Professional Bio</Label>
                <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Mission statement..." className="min-h-[100px] font-medium leading-relaxed" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Interests (Comma Separated)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input value={editInterests} onChange={(e) => setEditInterests(e.target.value)} placeholder="AI, Chess, Sports..." className="h-12 pl-10 font-bold uppercase tracking-tight" />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/30 border-t">
              <Button onClick={handleUpdateProfile} disabled={editLoading} className="w-full h-14 text-xl font-black italic tracking-tighter uppercase shadow-2xl transition-all">
                {editLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />} Synchronize Shard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8">
        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden rounded-[2.5rem] ring-1 ring-white/10">
          <CardHeader className="p-8 pb-4 flex flex-col sm:flex-row items-center gap-8">
            <Avatar className="h-32 w-32 ring-4 ring-primary/20 ring-offset-4 ring-offset-background shadow-2xl">
              <AvatarImage src={profile.profileImageUrl || `https://i.pravatar.cc/150?u=${user?.uid}`} />
              <AvatarFallback className="text-4xl font-black">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left space-y-2">
              <CardTitle className="text-4xl font-black italic tracking-tighter uppercase text-foreground leading-none">{displayName}</CardTitle>
              <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                    <School className="h-3.5 w-3.5" /> {profile.collegeName || "UNAFFILIATED"}
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{profile.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 shadow-inner">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Arena High Score</h3>
                <p className="text-5xl font-black italic tracking-tighter text-primary">{profile.highScore}</p>
              </div>
              <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 shadow-inner">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Achievement Rank</h3>
                 <p className="text-2xl font-black italic tracking-tighter text-foreground uppercase">{badges.length > 0 ? badges[badges.length - 1].name : "INITIATE"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ADMIN MAINTENANCE PROTOCOL */}
        {isAdmin && (
            <Card className="border-amber-500/20 bg-amber-500/[0.03] rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <ShieldAlert className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-amber-600">Identity Maintenance</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Global Core Protection Protocol</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                    <div className="flex flex-col gap-4">
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed italic border-l-4 border-amber-500 pl-4">
                            Authorized scrub initiated. All non-core student identities are targeted for deletion. Whitelist active: 
                            <span className="text-amber-600 font-bold ml-1">SAM123, JESSE, YUZII, LISA123</span>.
                        </p>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-black italic tracking-tighter text-lg rounded-2xl shadow-xl shadow-amber-600/20 gap-3">
                                    <Zap className="h-6 w-6" /> EXECUTE GLOBAL CLEANUP
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Confirm Sanitization?</AlertDialogTitle>
                                    <AlertDialogDescription className="font-medium text-base">
                                        This will permanently erase all unverified student identities, their high scores, and their entire activity history. Whitelisted students remain untouched.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-8">
                                    <AlertDialogCancel className="h-12 rounded-xl font-bold uppercase tracking-tight">ABORT PROTOCOL</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handlePurgeUnverifiedIdentities}
                                        disabled={isPurging}
                                        className="h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black italic uppercase tracking-tighter px-8"
                                    >
                                        {isPurging ? <Loader2 className="animate-spin h-5 w-5" /> : "SCRUB NOW"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                           <Hash className="h-3 w-3" /> ACTIVE NETWORK SHARDS ({allProfiles?.length || 0})
                        </Label>
                        <ScrollArea className="h-48 border-2 border-dashed rounded-2xl p-4 bg-background/50 shadow-inner">
                            <div className="space-y-3">
                                {allProfiles?.map(p => {
                                    const name = `${p.firstName} ${p.lastName}`.toUpperCase();
                                    const id = p.id;
                                    const email = p.email.toUpperCase();
                                    
                                    const isCore = CORE_WHITELIST.some(w => 
                                        name.includes(w.toUpperCase()) || 
                                        id.includes(w) || 
                                        email.includes(w.toUpperCase())
                                    );
                                    
                                    const isTarget = !isCore && id !== user?.uid;

                                    return (
                                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={p.profileImageUrl} />
                                                    <AvatarFallback>{p.firstName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase truncate max-w-[120px]">{p.firstName} {p.lastName}</span>
                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{p.email}</span>
                                                </div>
                                            </div>
                                            {isTarget ? (
                                                <Badge variant="destructive" className="text-[8px] font-black tracking-widest h-5 uppercase">TARGET</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[8px] font-black tracking-widest h-5 uppercase border-green-500 text-green-600 bg-green-500/5">CORE</Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card className="border-destructive/20 bg-destructive/[0.02] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-destructive text-2xl font-black italic tracking-tighter uppercase">Danger Zone</CardTitle>
            <CardDescription className="font-bold uppercase text-[10px] tracking-widest">Permanent account termination protocol.</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <p className="text-sm font-medium text-muted-foreground mb-6 max-w-lg leading-relaxed">
              Initiating this protocol will permanently wipe your identity, game scores, and network access. This action cannot be reversed.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-12 px-10 font-black italic uppercase tracking-tighter shadow-lg shadow-destructive/20">
                  <UserX className="mr-2 h-4 w-4" /> Purge Personal Identity
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Confirm Personal Purge?</AlertDialogTitle>
                  <AlertDialogDescription className="font-medium">
                    This action is final. Your presence on CollegeConnect will be erased. Proceed with caution.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-tight h-12">Abort Protocol</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-black italic uppercase tracking-tighter h-12"
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Initiate Purge"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
