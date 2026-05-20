
"use client";

import { useState } from "react";
import { collection, query, where, doc, updateDoc, arrayUnion, writeBatch } from "firebase/firestore";
import { useFirestore, useUser, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Users, Loader2, ShieldCheck, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GroupJoinRequest } from "@/types/firestore";

interface GroupRequestsDialogProps {
  groupId: string;
}

export function GroupRequestsDialog({ groupId }: GroupRequestsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !groupId || !user) return null;
    return query(
      collection(db, "groupJoinRequests"),
      where("groupId", "==", groupId),
      where("groupAdminId", "==", user.uid),
      where("status", "==", "pending")
    );
  }, [db, groupId, user]);

  const { data: requests, isLoading } = useCollection<GroupJoinRequest>(requestsQuery);

  const handleAction = async (request: GroupJoinRequest, status: 'accepted' | 'rejected') => {
    if (!db) return;
    setActionLoading(prev => ({ ...prev, [request.id]: true }));

    try {
      const batch = writeBatch(db);
      
      // Update request status
      const requestRef = doc(db, "groupJoinRequests", request.id);
      batch.update(requestRef, { status });

      // If accepted, add to group participants
      if (status === 'accepted') {
        const groupRef = doc(db, "chatConversations", groupId);
        batch.update(groupRef, {
          participantIds: arrayUnion(request.requesterId)
        });
      }

      await batch.commit();
      
      toast({
        title: status === 'accepted' ? "Recruit Integrated! 🤝" : "Access Denied",
        description: `${request.requesterName} has been ${status}.`,
      });
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: `groupJoinRequests/${request.id}`,
        operation: 'update',
        requestResourceData: { status },
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setActionLoading(prev => ({ ...prev, [request.id]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full h-12 font-black uppercase italic tracking-tighter rounded-xl border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all group">
          <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" /> 
          Pending Recruits ({requests?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-8 bg-foreground text-background">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase">Recruitment Hub</DialogTitle>
          </div>
          <DialogDescription className="text-background/60 font-bold uppercase tracking-widest text-[10px]">
            Vetting protocol for new group members.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="h-10 w-10 animate-spin text-primary" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scanning Identities...</p>
             </div>
          ) : requests && requests.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/50 transition-all hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                        <AvatarImage src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${request.requesterId}`} />
                        <AvatarFallback className="font-black">{request.requesterName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tight">{request.requesterName}</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                           <Mail className="h-3 w-3" /> {request.requesterEmail}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        className="h-10 w-10 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-90"
                        onClick={() => handleAction(request, 'accepted')}
                        disabled={actionLoading[request.id]}
                      >
                        {actionLoading[request.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm"
                        onClick={() => handleAction(request, 'rejected')}
                        disabled={actionLoading[request.id]}
                      >
                         <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border">
              <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
              <p className="text-muted-foreground font-black italic text-xl uppercase tracking-tighter">Queue Empty</p>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-2">All recruits have been vetted.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
