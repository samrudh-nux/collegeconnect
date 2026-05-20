"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, serverTimestamp, where, doc } from "firebase/firestore";
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Loader2, Users, Search, Sparkles, UserPlus, Hash, Clock, MessageSquare, School, UserCircle, Ghost } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import type { UserProfile, ChatConversation, GroupJoinRequest } from "@/types/firestore";

const CORE_WHITELIST = ["SAM123", "JESSE", "YUZII", "LISA123"];

export default function ConnectPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  
  const profilesQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !currentUser) return null;
    return query(collection(db, "userProfiles"));
  }, [db, currentUser, isUserLoading]);
  
  const groupsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !currentUser) return null;
    return query(collection(db, "chatConversations"), where("type", "==", "group"));
  }, [db, currentUser, isUserLoading]);

  const myRequestsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !currentUser) return null;
    return query(collection(db, "groupJoinRequests"), where("requesterId", "==", currentUser.uid));
  }, [db, currentUser, isUserLoading]);
  
  const { data: userProfiles, isLoading: profilesLoading } = useCollection<UserProfile>(profilesQuery);
  const { data: conversations, isLoading: groupsLoading } = useCollection<ChatConversation>(groupsQuery);
  const { data: myRequests } = useCollection<GroupJoinRequest>(myRequestsQuery);

  const handleMessagePeer = (targetUser: UserProfile) => {
    if (!currentUser || !db) return;

    const conversationId = [currentUser.uid, targetUser.id].sort().join('_');
    const convRef = doc(db, "chatConversations", conversationId);

    const chatData = {
      id: conversationId,
      participantIds: [currentUser.uid, targetUser.id],
      type: "one-to-one" as const,
      createdAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
      adminId: currentUser.uid,
    };

    // Instant Action: Set data and move user immediately
    setDocumentNonBlocking(convRef, chatData, { merge: true });
    router.push(`/chat?id=${conversationId}`);
  };

  const handleChallenge = (targetUser: UserProfile) => {
    if (!currentUser || !db) return;
    
    const gameRequestData = {
        requesterId: currentUser.uid,
        requesterEmail: currentUser.email || 'Anonymous',
        recipientId: targetUser.id,
        recipientEmail: targetUser.email,
        gameId: 'chess',
        status: 'pending',
        requestedAt: serverTimestamp(),
    }
    const gameRequestsCollection = collection(db, "gameRequests");

    // Instant Feedback: Fire request and notify student
    addDocumentNonBlocking(gameRequestsCollection, gameRequestData);
    toast({
      title: "Challenge Sent!",
      description: `Your game challenge has been transmitted to ${targetUser.firstName}.`,
    });
  };

  const handleRequestJoin = (group: ChatConversation) => {
    if (!currentUser || !db) return;

    const requestData = {
      groupId: group.id,
      groupName: group.name || "Unnamed Group",
      groupAdminId: group.adminId,
      requesterId: currentUser.uid,
      requesterName: currentUser.displayName || currentUser.email?.split('@')[0] || "Student",
      requesterEmail: currentUser.email || "",
      status: "pending",
      timestamp: serverTimestamp(),
    };

    const requestsCollection = collection(db, "groupJoinRequests");

    // High-Speed Recruitment Protocol
    addDocumentNonBlocking(requestsCollection, requestData);
    toast({
      title: "Request Transmitted! 🛰️",
      description: `Access request for ${group.name} is now pending vetting.`,
    });
  };

  const handleViewProfile = (userId: string) => {
    if (userId === currentUser?.uid) {
        router.push('/profile');
    } else {
        router.push(`/profile/${userId}`);
    }
  };

  const filteredUsers = userProfiles
    ?.filter(p => {
        const fullName = `${p.firstName} ${p.lastName}`.toUpperCase();
        const email = (p.email || '').toUpperCase();
        const id = p.id;
        
        const isCore = CORE_WHITELIST.some(w => 
            fullName.includes(w.toUpperCase()) || 
            id.includes(w) || 
            email.includes(w.toUpperCase())
        );
        
        return (isCore || p.id === currentUser?.uid) && p.id !== currentUser?.uid;
    })
    ?.filter(p => {
        if (!searchQuery) return true;
        const searchTerm = searchQuery.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const email = (p.email || '').toLowerCase();
        const college = (p.collegeName || '').toLowerCase();
        const interests = (p.interests || []).join(" ").toLowerCase();
        return fullName.includes(searchTerm) || email.includes(searchTerm) || college.includes(searchTerm) || interests.includes(searchTerm);
    });

  const filteredGroups = conversations
    ?.filter(c => {
        if (!searchQuery) return true;
        return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <div className="container mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Connect Hub</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] ml-1.5 mt-1">Global Student Network</p>
            </div>
          </div>
        </div>
        
        <CreateGroupDialog students={userProfiles} />
      </div>

      <Tabs defaultValue="peers" className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
          <TabsList className="bg-muted/40 p-1.5 border-2 border-border/50 h-14 rounded-2xl shadow-sm">
            <TabsTrigger value="peers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter px-10 text-xs rounded-xl h-full transition-all">
              <UserPlus className="h-4 w-4 mr-2" /> Students
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black italic uppercase tracking-tighter px-10 text-xs rounded-xl h-full transition-all">
              <Hash className="h-4 w-4 mr-2" /> Community Groups
            </TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, college, or interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-card/50 border-2 rounded-2xl shadow-sm transition-all focus:border-primary focus:ring-0 w-full sm:w-96 font-bold uppercase tracking-tight"
            />
          </div>
        </div>
        
        <TabsContent value="peers" className="mt-0">
          {profilesLoading || isUserLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-none shadow-xl bg-card/40">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <Skeleton className="h-28 w-28 rounded-full mb-6" />
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredUsers && filteredUsers.map((userProfile) => (
                <Card 
                    key={userProfile.id} 
                    className="group border-none shadow-2xl bg-card/50 backdrop-blur-md hover:scale-[1.03] transition-all duration-500 overflow-hidden relative rounded-[2rem] ring-1 ring-white/10"
                >
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/10 to-transparent" />
                  <CardContent className="p-8 flex flex-col items-center text-center flex-1 relative">
                    <div 
                        className="relative mb-6 cursor-pointer"
                        onClick={() => handleViewProfile(userProfile.id)}
                    >
                      <Avatar className="h-28 w-28 border-4 border-background shadow-2xl transition-transform duration-700 group-hover:rotate-6">
                        <AvatarImage src={userProfile.profileImageUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${userProfile.id}`} />
                        <AvatarFallback className="bg-primary/5 text-primary font-black text-3xl">
                           <Ghost className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <UserCircle className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <p 
                        className="font-black text-2xl italic tracking-tighter uppercase text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleViewProfile(userProfile.id)}
                    >
                        {`${userProfile.firstName} ${userProfile.lastName}`.trim()}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-primary font-black uppercase tracking-widest text-[10px]">
                       <School className="h-3.5 w-3.5" /> {userProfile.collegeName || "Independent Student"}
                    </div>

                    <p className="text-xs font-medium text-muted-foreground/80 italic line-clamp-2 mt-4 min-h-[2.5rem]">
                      {userProfile.bio || "No professional briefing transmitted yet."}
                    </p>

                    <div className="flex flex-wrap justify-center gap-1.5 mt-6">
                       {userProfile.interests && userProfile.interests.slice(0, 3).map((interest, i) => (
                          <Badge key={i} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                             #{interest}
                          </Badge>
                       ))}
                       {userProfile.interests && userProfile.interests.length > 3 && (
                         <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 opacity-40">
                           +{userProfile.interests.length - 3} MORE
                         </Badge>
                       )}
                    </div>
                    
                    <div className="flex flex-col gap-3 mt-8 w-full">
                        <Button 
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black italic uppercase tracking-tighter rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" 
                            onClick={() => handleMessagePeer(userProfile)} 
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            MESSAGE PEER
                        </Button>
                        <Button 
                            className="w-full h-12 font-black italic uppercase tracking-tighter rounded-xl border-2 hover:bg-muted transition-all" 
                            variant="outline" 
                            onClick={() => handleChallenge(userProfile)} 
                        >
                            <Gamepad2 className="h-5 w-5 mr-2" />
                            CHALLENGE PEER
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-none shadow-xl">
                    <CardContent className="p-8">
                        <Skeleton className="h-8 w-1/2 mb-6" />
                        <Skeleton className="h-5 w-full mb-3" />
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGroups && filteredGroups.map((group) => {
                const isMember = group.participantIds.includes(currentUser?.uid || "");
                const hasPendingRequest = myRequests?.some(r => r.groupId === group.id && r.status === 'pending');

                return (
                  <Card key={group.id} className="group border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden relative hover:scale-[1.02] transition-all duration-500 rounded-[2rem]">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center gap-3 mb-4">
                         <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary bg-primary/5 px-4 py-1.5 rounded-full">
                            {group.category || "General"}
                         </Badge>
                      </div>
                      <CardTitle className="text-3xl font-black italic tracking-tighter uppercase text-foreground">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="font-medium text-muted-foreground/80 line-clamp-2 mt-2 text-sm italic">
                        {group.description || "A high-security zone for collaboration and growth."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-8">
                      <div className="flex flex-col gap-3">
                        {isMember ? (
                           <Button 
                              onClick={() => router.push(`/chat?id=${group.id}`)}
                              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black italic tracking-tight uppercase rounded-2xl shadow-xl shadow-primary/20"
                           >
                                ENTER COMMAND ROOM <MessageSquare className="ml-2 h-5 w-5" />
                           </Button>
                        ) : hasPendingRequest ? (
                           <Button disabled className="w-full h-14 bg-muted text-muted-foreground border-2 font-black italic uppercase tracking-tighter rounded-2xl">
                               <Clock className="mr-2 h-5 w-5" /> TRANSMISSION PENDING...
                           </Button>
                        ) : (
                           <Button 
                              onClick={() => handleRequestJoin(group)}
                              className="w-full h-14 bg-foreground hover:bg-foreground/90 text-background font-black italic tracking-tight uppercase rounded-2xl shadow-xl"
                           >
                               REQUEST ACCESS
                           </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}