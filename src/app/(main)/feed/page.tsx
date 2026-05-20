
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, useStorage } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquareShare, Loader2, Sparkles, UserCircle2, Ghost, ShieldCheck, Paperclip, FileText, Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { GlobalFeedMessage } from "@/types/firestore";

const CORE_WHITELIST = ["SAM123", "JESSE", "YUZII", "LISA123"];

export default function FeedPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const globalFeedQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return query(
      collection(db, "globalFeedMessages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, user, isUserLoading]);

  const { data: rawMessages, isLoading: isMessagesLoading } = useCollection<GlobalFeedMessage>(globalFeedQuery);

  const messages = rawMessages?.filter(msg => {
    const authorName = msg.authorName.toUpperCase();
    const authorId = msg.authorId;
    const authorEmail = msg.authorEmail.toUpperCase();
    
    const isCore = CORE_WHITELIST.some(w => 
        authorName.includes(w.toUpperCase()) || 
        authorId.includes(w) || 
        authorEmail.includes(w.toUpperCase())
    );
    
    return isCore || authorId === user?.uid;
  });

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
    if ((!newMessage.trim() && !fileData) || !user || !db || isSending) return;

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const messageData = {
      authorId: user.uid,
      authorEmail: user.email || "Anonymous",
      authorName: user.displayName || user.email?.split("@")[0] || "Student",
      authorAvatar: user.photoURL || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.uid}`,
      content: content,
      fileUrl: fileData?.url || null,
      fileName: fileData?.name || null,
      createdAt: serverTimestamp(),
    };

    const feedCollection = collection(db, "globalFeedMessages");
    
    // High-Speed Feed Protocol: Instant update
    addDocumentNonBlocking(feedCollection, messageData);
    setIsSending(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    const timestamp = Date.now();
    const storageRef = ref(storage, `feed-attachments/${user.uid}/${timestamp}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setUploadProgress(null);
        toast({
            variant: "destructive",
            title: "Transmission Error",
            description: "Failed to bridge file to the network hive.",
        });
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        handleSendMessage(undefined, { url, name: file.name });
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast({
            title: "Transmission Success! 🚀",
            description: `Shard "${file.name}" has been synchronized with the feed.`,
        });
      }
    );
  };

  const handleAuthorClick = (authorId: string) => {
    if (authorId === user?.uid) {
        router.push('/profile');
    } else {
        router.push(`/profile/${authorId}`);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="container mx-auto max-w-[1400px] flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-primary font-black uppercase tracking-[0.4em] text-xs">Connecting to community hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1400px] space-y-4 h-[calc(100vh-4rem)] flex flex-col pb-2">
      <Suspense fallback={null}>
        <WelcomeDialog />
      </Suspense>

      <div className="flex flex-col gap-1 px-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-[1.2rem] shadow-inner border border-primary/20">
            <MessageSquareShare className="h-7 w-7 text-primary" />
          </div>
          <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Community Hub</h1>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.5em] ml-1.5 mt-0.5">Verified Student Network</p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-3xl bg-card/40 backdrop-blur-2xl rounded-[2.5rem] ring-1 ring-white/10">
        <CardHeader className="border-b py-5 px-8 bg-muted/20 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-xl font-black italic uppercase tracking-tight">Global Command Feed</CardTitle>
          </div>
          <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Updates Active</div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col min-h-0">
          <ScrollArea ref={scrollRef} className="flex-1 px-8">
            <div className="py-8 space-y-6">
              {isMessagesLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em] animate-pulse">Syncing Thoughts...</p>
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.authorId === user.uid ? 'flex-row-reverse' : ''}`}>
                    <Avatar 
                        className="h-14 w-14 border-4 border-background shadow-xl mt-1 cursor-pointer transition-all hover:scale-110 active:scale-90"
                        onClick={() => handleAuthorClick(msg.authorId)}
                    >
                      <AvatarImage src={msg.authorAvatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${msg.authorId}`} className="bg-muted/10" />
                      <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                        <Ghost className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col max-w-[80%] ${msg.authorId === user.uid ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-3 mb-1.5 px-1">
                        <span 
                            className="text-[13px] font-black text-muted-foreground uppercase tracking-tight cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5"
                            onClick={() => handleAuthorClick(msg.authorId)}
                        >
                          {msg.authorName}
                          <ShieldCheck className="h-3 w-3 text-primary opacity-50" />
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                          {msg.createdAt ? format(msg.createdAt.toDate(), 'h:mm a') : '...'}
                        </span>
                      </div>
                      <div className={`p-6 rounded-[2rem] shadow-lg text-lg leading-relaxed font-medium italic relative overflow-hidden ${
                        msg.authorId === user.uid 
                          ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/20' 
                          : 'bg-card/90 text-foreground rounded-tl-none border-2 border-border/50 shadow-inner'
                      }`}>
                        {msg.content && <p className="relative z-10">"{msg.content}"</p>}
                        
                        {msg.fileUrl && (
                          <div 
                            onClick={() => window.open(msg.fileUrl!, '_blank')}
                            className={cn(
                                "mt-4 p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group/file",
                                msg.authorId === user.uid 
                                    ? "bg-white/10 border-white/20 hover:bg-white/20" 
                                    : "bg-primary/5 border-primary/10 hover:bg-primary/10"
                            )}
                          >
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center shadow-inner",
                                msg.authorId === user.uid ? "bg-white/20" : "bg-primary/20"
                            )}>
                                {msg.fileName?.match(/\.(jpg|jpeg|png|gif|svg)$/i) ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Packet Transmission</p>
                                <p className="text-sm font-black truncate uppercase tracking-tight">{msg.fileName}</p>
                            </div>
                            <ExternalLink className="h-5 w-5 opacity-40 group-hover/file:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center gap-8 animate-in fade-in duration-1000">
                  <div className="h-32 w-32 bg-muted/20 rounded-[2rem] flex items-center justify-center border-4 border-dashed border-muted shadow-inner">
                    <UserCircle2 className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black italic text-3xl text-muted-foreground uppercase tracking-tighter">Network Silenced</p>
                    <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] max-w-sm mx-auto">
                      Only verified core student transmissions are currently visible on this frequency.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-muted/30 border-t backdrop-blur-3xl shrink-0">
            {uploadProgress !== null && (
                <div className="max-w-[1200px] mx-auto mb-4 space-y-2 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest animate-pulse flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> Bridging Transmission Shard...
                        </span>
                        <span className="text-[10px] font-black text-primary">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 bg-primary/10 border-none overflow-hidden" />
                </div>
            )}
            <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-4 max-w-[1200px] mx-auto">
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
              />
              <Button 
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 rounded-[1.2rem] border-2 hover:bg-primary/5 shadow-xl transition-all active:scale-95 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadProgress !== null}
              >
                  <Paperclip className="h-7 w-7 text-muted-foreground" />
              </Button>
              
              <div className="relative flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Encrypt and share your professional briefing..."
                  className="pr-16 h-16 bg-background border-2 border-border/50 focus:border-primary transition-all rounded-[1.2rem] font-bold uppercase tracking-tight text-lg shadow-inner"
                  disabled={isSending || uploadProgress !== null}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                   {isSending && <Loader2 className="h-8 w-8 animate-spin text-primary/40" />}
                </div>
              </div>
              <Button 
                type="submit" 
                size="icon" 
                className="h-16 w-16 rounded-[1.2rem] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all bg-gradient-to-r from-primary to-accent flex-shrink-0"
                disabled={(!newMessage.trim() && uploadProgress === null) || isSending || uploadProgress !== null}
              >
                <Send className="h-8 w-8" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
