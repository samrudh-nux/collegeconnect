
"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, Loader2, Search, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types/firestore";

interface CreateGroupDialogProps {
  students: UserProfile[] | null;
}

export function CreateGroupDialog({ students }: CreateGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const filteredStudents = students?.filter(s => 
    s.id !== currentUser?.uid && 
    (s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || !currentUser || !db) return;
    
    setIsLoading(true);
    
    const conversationData = {
      name: name.trim(),
      description: description.trim(),
      type: "group",
      adminId: currentUser.uid, // Burn the Admin Identity
      participantIds: [currentUser.uid, ...selectedIds],
      createdAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
      category: "General",
    };

    const conversationsCollection = collection(db, "chatConversations");

    addDoc(conversationsCollection, conversationData)
      .then(() => {
        toast({
          title: "Kingdom Forged! 🏰",
          description: `${name} is live. You are the Commander-in-Chief.`,
        });
        setIsOpen(false);
        resetForm();
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: conversationsCollection.path,
          operation: 'create',
          requestResourceData: conversationData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedIds([]);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-black italic uppercase tracking-tighter gap-2 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 h-12">
          <Plus className="h-5 w-5" /> Forge Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-white" />
            <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase">Command Center</DialogTitle>
          </div>
          <DialogDescription className="text-primary-foreground/80 font-bold uppercase tracking-widest text-[10px]">
            As Admin, you control the recruitment pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Identity Tag</Label>
              <Input
                id="name"
                placeholder="STUDY_WARRIORS_2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 border-2 font-black uppercase italic text-lg focus:ring-0 focus:border-primary transition-all"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Mission Briefing</Label>
              <Input
                id="description"
                placeholder="What is the objective of this unit?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-14 border-2 font-medium focus:ring-0 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Direct Recruits ({selectedIds.length})</Label>
              <div className="relative w-1/2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Scan Network..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-[10px] uppercase font-bold tracking-widest bg-muted/50 border-none"
                />
              </div>
            </div>
            <ScrollArea className="h-[250px] border-2 border-dashed rounded-2xl p-2 bg-muted/20">
              <div className="space-y-2">
                {filteredStudents?.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer border-2 ${
                      selectedIds.includes(student.id) ? 'bg-primary/5 border-primary/20 scale-[0.98]' : 'bg-background border-transparent hover:bg-muted/50'
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={student.profileImageUrl || `https://i.pravatar.cc/150?u=${student.id}`} />
                        <AvatarFallback className="font-black text-xs">{student.firstName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tight">{student.firstName} {student.lastName}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{student.email}</span>
                      </div>
                    </div>
                    <Checkbox checked={selectedIds.includes(student.id)} className="h-5 w-5 rounded-md" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-8 bg-muted/30 border-t">
          <Button
            onClick={handleCreate}
            disabled={isLoading || !name.trim()}
            className="w-full h-16 text-2xl font-black italic tracking-tighter uppercase shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Initiate Protocol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
