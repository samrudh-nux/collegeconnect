
"use client";

import { useState, useRef, useMemo } from "react";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { 
  useFirestore, 
  useStorage, 
  useUser, 
  useCollection, 
  useMemoFirebase, 
  errorEmitter, 
  FirestorePermissionError 
} from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, FileText, CheckCircle2, Zap, Database, User, FileUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/firestore";

/**
 * A stylized local Badge component for the Resource Hub
 */
const HubBadge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black border tracking-widest uppercase", className)}>
        {children}
    </div>
);

export default function DocumentsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const storage = useStorage();
  const { user, isUserLoading } = useUser();

  // Simple query without orderBy to avoid index-based "loading" hangs.
  // We will sort client-side for maximum speed and reliability.
  const docsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return query(collection(db, "documents"));
  }, [db, user, isUserLoading]);

  const { data: rawDocuments, isLoading: isDocsLoading } = useCollection<Document>(docsQuery);

  // Client-side sorting: Instant and requires zero database indexing
  const documents = useMemo(() => {
    if (!rawDocuments) return null;
    return [...rawDocuments].sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
    });
  }, [rawDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startUpload(e.target.files[0]);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const startUpload = (file: File) => {
    if (!user || !storage || !db) {
      toast({
        variant: "destructive",
        title: "Systems Offline",
        description: "Cloud services are initializing. Please wait 2 seconds and retry.",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create high-capacity storage reference
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storageRef = ref(storage, `documents/${user.uid}/${timestamp}_${safeName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        toast({
          variant: "destructive",
          title: "Transmission Failed",
          description: error.message || "Could not bridge to cloud storage.",
        });
        setIsUploading(false);
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const docData = {
            name: file.name,
            url: downloadURL,
            uploaderId: user.uid,
            uploaderEmail: user.email || 'Verified Student',
            createdAt: serverTimestamp(),
          };
          
          const docsCollection = collection(db, "documents");
          
          // Non-blocking Firestore save for instant feedback
          addDoc(docsCollection, docData)
            .then(() => {
                toast({
                    title: "Transmission Success! 🚀",
                    description: `${file.name} is now synchronized with the Hive.`,
                });
            })
            .catch((serverError) => {
              const permissionError = new FirestorePermissionError({
                path: docsCollection.path,
                operation: 'create',
                requestResourceData: docData,
              });
              errorEmitter.emit('permission-error', permissionError);
            });
          
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Metadata Sync Error",
            description: "Resource uploaded but catalog failed to update.",
          });
        } finally {
          setIsUploading(false);
          setUploadProgress(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    );
  };

  const renderDate = (doc: Document) => {
    if (!doc.createdAt) return 'Indexing...';
    try {
      return format(doc.createdAt.toDate(), 'MMM d, yyyy');
    } catch (e) {
      return 'Just now';
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Initializing Identity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase">Resource Hub</h1>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] ml-1">Enterprise Data Hive</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[320px]">
          <Input 
            ref={fileInputRef}
            type="file" 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.csv,.json"
          />
          <Button 
            onClick={triggerFilePicker} 
            disabled={isUploading} 
            className="h-14 px-8 font-black italic uppercase tracking-tighter text-lg shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] group relative overflow-hidden"
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-6 w-6 group-hover:-translate-y-1 transition-transform" />
            )}
            {isUploading ? "Uploading Data..." : "Turbo Upload Resource"}
            
            {isUploading && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${uploadProgress || 0}%` }} />
            )}
          </Button>
          
          {uploadProgress !== null && (
            <div className="w-full space-y-1.5 mt-2 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black uppercase text-primary tracking-widest animate-pulse">Transmitting Packet...</span>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
              <Progress value={uploadProgress} className="h-1 bg-muted border-none overflow-hidden" />
            </div>
          )}
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-white/10">
        <CardHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <CardTitle className="text-xl font-black italic uppercase tracking-tight">Community library</CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Resource Index</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-200/50 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Ultra-Fast CDN Active
                </div>
                <HubBadge className="bg-primary/5 text-primary border-primary/20">
                    {documents?.length || 0} Shards Indexed
                </HubBadge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isDocsLoading ? (
            <div className="flex flex-col items-center justify-center p-32 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
                <div className="text-center">
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Synchronizing Shards</p>
                    <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">Accessing Global CDN...</p>
                </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-b-2 border-border/50">
                    <TableHead className="font-black uppercase tracking-widest italic text-[10px] text-muted-foreground pl-8">Resource Identity</TableHead>
                    <TableHead className="font-black uppercase tracking-widest italic text-[10px] text-muted-foreground">Source (Who Added)</TableHead>
                    <TableHead className="font-black uppercase tracking-widest italic text-[10px] text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-right font-black uppercase tracking-widest italic text-[10px] text-muted-foreground pr-8">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents && documents.length > 0 ? (
                    documents.map((doc) => (
                      <TableRow key={doc.id} className="group hover:bg-primary/[0.03] transition-all border-b border-border/30">
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center group-hover:bg-primary/10 transition-all border border-border/50 group-hover:scale-105 shadow-inner">
                                <FileText className={cn(
                                    "h-6 w-6 transition-colors",
                                    doc.name.toLowerCase().endsWith('.pdf') ? "text-red-500" : "text-muted-foreground group-hover:text-primary"
                                )} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-black text-sm truncate max-w-[280px] uppercase tracking-tight group-hover:text-primary transition-colors">{doc.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Verified Packet</span>
                                    {doc.name.toLowerCase().endsWith('.pdf') && (
                                        <span className="text-[8px] font-black bg-red-500/10 text-red-600 px-1.5 rounded-sm border border-red-500/20">PDF</span>
                                    )}
                                </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <User className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <span className="text-[10px] font-black text-muted-foreground/80 bg-muted/50 px-3 py-1 rounded-md border border-border/50 truncate max-w-[200px] uppercase tracking-tighter">
                                {doc.uploaderEmail}
                              </span>
                           </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                          {renderDate(doc)}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button asChild variant="ghost" size="sm" className="h-10 px-6 font-black italic uppercase tracking-tighter group/dl hover:bg-primary hover:text-white transition-all border border-transparent hover:border-primary/20 shadow-none">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4 transition-transform group-hover/dl:-translate-y-0.5" />
                              Fetch Resource
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-48 text-muted-foreground bg-muted/5">
                        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-1000">
                          <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center opacity-30 shadow-inner">
                             <Database className="h-12 w-12" />
                          </div>
                          <div className="space-y-1.5">
                             <p className="font-black italic text-2xl uppercase tracking-tighter">Library Shard Empty</p>
                             <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.4em]">Initialize high-speed data transmission</p>
                          </div>
                          <Button variant="outline" onClick={triggerFilePicker} className="mt-4 font-black italic tracking-widest border-2 hover:bg-primary hover:text-white transition-all">
                            UPLOAD FIRST RESOURCE
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/10 bg-primary/[0.02] flex flex-col sm:flex-row items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Zap className="h-7 w-7 text-primary animate-pulse" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider leading-relaxed">
                All shards are encrypted and verified via the <span className="text-primary font-black italic underline decoration-primary/30">CollegeConnect Distributed Ledger</span>.
            </p>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                Instant accessibility protocol active for all authenticated network students.
            </p>
          </div>
      </div>
    </div>
  );
}
