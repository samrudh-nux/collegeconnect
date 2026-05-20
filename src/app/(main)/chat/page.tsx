"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useFirestore, useUser, useCollection, useMemoFirebase, useStorage, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, Search, Zap, ArrowLeft, MoreVertical, Paperclip, FileText, Download, UserCircle, Ghost } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ChatConversation, Message as MessageType, UserProfile } from "@/types/firestore";

function ChatContent() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get("id");
  
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allProfilesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "userProfiles");
  }, [db]);
  const { data: allProfiles } = useCollection<UserProfile>(allProfilesQuery);

  const conversationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "chatConversations"),
      where("participantIds", "array-contains", user.uid)
    );
  }, [db, user]);

  const { data: rawConversations, isLoading: isConvLoading } = useCollection<ChatConversation>(conversationsQuery);

  const conversations = useMemo(() => {
    if (!rawConversations) return null;
    return [...rawConversations].sort((a, b) => {
        const timeA = a.lastMessageTimestamp?.toMillis?.() || 0;
        const timeB = b.lastMessageTimestamp?.toMillis?.() || 0;
        return timeB - timeA;
    });
  }, [rawConversations]);

  const activeConv = conversations?.find(c => c.id === activeConversationId);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !activeConversationId || !activeConv) return null;
    return query(
      collection(db, "chatConversations", activeConversationId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );
  }, [db, activeConversationId, activeConv]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection<MessageType>(messagesQuery);

  const getChatIdentity = (conv: ChatConversation) => {
    if (conv.type === 'group') return { id: conv.id, name: conv.name || "Group", avatar: `https://api.dicebear.com/9.x/bottts/svg?seed=${conv.id}`, isGroup: true };
    
    const otherId = conv.participantIds.find(id => id !== user?.uid);
    const profile = allProfiles?.find(p => p.id === otherId);
    
    return {
      id: otherId,
      name: profile ? `${profile.firstName} ${profile.lastName}` : "Peer Connection",
      avatar: profile?.profileImageUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${otherId}`,
      isGroup: false
    };
  };

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent, fileData?: { url: string, name: string }) => {
    if (e) e.preventDefault();
    if (!activeConversationId || !user || !db || isSending) return;
    if (!newMessage.trim() && !fileData) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || user.email?.split("@")[0] || "Student",
      senderEmail: user.email || "",
      senderAvatar: user.photoURL || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.uid}`,
      text: text,
      fileUrl: fileData?.url || null,
      fileName: fileData?.name || null,
      timestamp: serverTimestamp(),
    };

    const messagesCollection = collection(db, "chatConversations", activeConversationId, "messages");
    const convRef = doc(db, "chatConversations", activeConversationId);

    addDocumentNonBlocking(messagesCollection, messageData);
    updateDocumentNonBlocking(convRef, { lastMessageTimestamp: serverTimestamp() });

    setIsSending(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user || !activeConversationId) return;

    const timestamp = Date.now();
    const storageRef = ref(storage, `chat-attachments/${activeConversationId}/${timestamp}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setUploadProgress(null);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        handleSendMessage(undefined, { url, name: file.name });
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    );
  };

  const handleViewProfile = (userId: string) => {
    if (userId === user?.uid) {
        router.push('/profile');
    } else {
        router.push(`/profile/${userId}`);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 animate-in fade-in duration-700">
      <Card className={cn(
        "flex-col w-full md:w-80 border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden",
        activeConversationId ? "hidden md:flex" : "flex"
      )}>
        <CardHeader className="bg-muted/20 border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black italic uppercase tracking-tight">Messages</h2>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search chats..." className="pl-9 h-10 text-xs bg-background border-none shadow-inner" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isConvLoading ? (
               <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
               </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => {
                const identity = getChatIdentity(conv);
                return (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/chat?id=${conv.id}`)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-primary/5",
                      activeConversationId === conv.id ? "bg-primary/10 border-r-4 border-primary" : ""
                    )}
                  >
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={identity.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        <Ghost className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-black text-sm uppercase tracking-tight truncate pr-2">
                          {identity.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-widest opacity-60">
                        {conv.type === 'one-to-one' ? 'Private' : conv.category || 'Group'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                 <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-40">No conversations yet</p>
                 <Button variant="link" size="sm" onClick={() => router.push('/connect')} className="mt-2 text-[10px] font-black italic uppercase">Find Peers</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className={cn(
        "flex-1 flex flex-col border-none shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden relative",
        !activeConversationId ? "hidden md:flex" : "flex"
      )}>
        {activeConversationId && activeConv ? (
          <>
            <CardHeader className="bg-muted/30 border-b py-3 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/chat')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar 
                    className="h-10 w-10 border-2 border-background shadow-md cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => !getChatIdentity(activeConv).isGroup && handleViewProfile(getChatIdentity(activeConv).id!)}
                  >
                    <AvatarImage src={getChatIdentity(activeConv).avatar} />
                    <AvatarFallback className="font-black text-xs">
                        <Ghost className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle 
                        className={cn("text-lg font-black italic uppercase tracking-tight", !getChatIdentity(activeConv).isGroup && "cursor-pointer hover:text-primary transition-colors")}
                        onClick={() => !getChatIdentity(activeConv).isGroup && handleViewProfile(getChatIdentity(activeConv).id!)}
                    >
                      {getChatIdentity(activeConv).name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                       <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Status</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {!getChatIdentity(activeConv).isGroup && (
                       <Button variant="ghost" size="icon" onClick={() => handleViewProfile(getChatIdentity(activeConv).id!)}>
                           <UserCircle className="h-5 w-5 text-muted-foreground" />
                       </Button>
                   )}
                   <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5 text-muted-foreground" /></Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative min-h-0">
              <ScrollArea ref={scrollRef} className="h-full px-6">
                <div className="py-8 space-y-6">
                  {isMessagesLoading ? (
                    <div className="flex justify-center p-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                          msg.senderId === user.uid ? "flex-row-reverse" : ""
                        )}
                      >
                        <Avatar 
                            className="h-8 w-8 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => handleViewProfile(msg.senderId)}
                        >
                          <AvatarImage src={msg.senderAvatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${msg.senderId}`} />
                          <AvatarFallback className="text-[8px] font-bold">
                              <Ghost className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "flex flex-col max-w-[70%]",
                          msg.senderId === user.uid ? "items-end" : "items-start"
                        )}>
                          <span 
                            className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 px-1 tracking-wider cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewProfile(msg.senderId)}
                          >
                            {msg.senderName}
                          </span>
                          <div className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.senderId === user.uid 
                              ? "bg-primary text-primary-foreground rounded-br-none" 
                              : "bg-muted text-foreground rounded-bl-none border border-border/50"
                          )}>
                            {msg.text && <p>{msg.text}</p>}
                            
                            {msg.fileUrl && (
                                <div className={cn(
                                    "mt-2 p-3 rounded-xl border flex items-center gap-3 bg-background/10",
                                    msg.senderId === user.uid ? "border-white/20" : "border-black/5"
                                )}>
                                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold truncate uppercase">{msg.fileName || 'Shared Document'}</p>
                                        <Button asChild variant="link" size="sm" className="h-auto p-0 text-[9px] font-black italic uppercase tracking-tighter text-inherit opacity-80">
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-3 w-3 mr-1" /> Download
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-1 flex justify-end">
                               <span className={cn(
                                 "text-[8px] opacity-60 font-bold",
                                 msg.senderId === user.uid ? "text-primary-foreground" : "text-muted-foreground"
                               )}>
                                 {msg.timestamp ? format(msg.timestamp.toDate(), 'h:mm a') : '...'}
                               </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                       <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                       </div>
                       <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-40">Zero transmissions in this frequency</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <div className="p-6 bg-muted/20 border-t backdrop-blur-md">
              {uploadProgress !== null && (
                  <div className="mb-4 text-[10px] font-black text-primary uppercase tracking-widest animate-pulse flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Transmitting File: {Math.round(uploadProgress)}%
                  </div>
              )}
              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl border-2 hover:bg-primary/5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProgress !== null}
                >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
                
                <div className="relative flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Encrypt and send..."
                    className="pr-12 h-14 bg-background border-2 border-border/50 focus:border-primary rounded-2xl font-medium shadow-inner"
                    disabled={isSending || uploadProgress !== null}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                     {isSending && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  disabled={(!newMessage.trim() && uploadProgress === null) || isSending}
                >
                  <Send className="h-6 w-6" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="bg-primary/5 p-10 rounded-[3rem] mb-8 border-2 border-dashed border-primary/10">
               <MessageSquare className="h-20 w-20 text-primary opacity-20" />
            </div>
            <h3 className="text-3xl font-black italic tracking-tighter uppercase text-muted-foreground">Command Interface</h3>
            <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mt-3">Select a peer or group to engage communication</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
