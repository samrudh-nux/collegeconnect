
"use client";

import { useEffect, useRef } from "react";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sword, XCircle } from "lucide-react";

interface GameRequest {
  id: string;
  requesterEmail: string;
  requesterId: string;
  recipientEmail: string;
  recipientId: string;
  status: "pending" | "accepted" | "declined";
  requestedAt: Timestamp;
}

export default function GameRequestListener() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast, dismiss } = useToast();
  const notifiedRequestIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, "gameRequests"),
      where("recipientId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const request = {
            id: change.doc.id,
            ...change.doc.data(),
          } as GameRequest;

          if (notifiedRequestIds.current.has(request.id)) return;

          notifiedRequestIds.current.add(request.id);

          const { id: toastId } = toast({
            title: "New Challenge Received! ♟️",
            description: (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-lg border border-primary/10">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold truncate max-w-[200px]">{request.requesterEmail}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium italic">"Accept this challenge to prove your grandmaster status!"</p>
              </div>
            ),
            duration: 600000,
            action: (
              <div className="flex flex-col gap-2 w-full mt-2">
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 font-black italic tracking-tight gap-2"
                  onClick={() => {
                    const updateData = { status: "accepted" };
                    const requestRef = doc(db, "gameRequests", request.id);
                    updateDoc(requestRef, updateData)
                      .then(() => {
                        dismiss(toastId);
                        toast({ title: "Challenge Accepted!", description: "Go to the Gaming Hub to begin." });
                      })
                      .catch(async () => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: requestRef.path, operation: 'update', requestResourceData: updateData }));
                      });
                  }}
                >
                  <Sword className="h-4 w-4" /> ACCEPT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full font-bold gap-2"
                  onClick={() => {
                    const updateData = { status: "declined" };
                    const requestRef = doc(db, "gameRequests", request.id);
                    updateDoc(requestRef, updateData)
                      .then(() => dismiss(toastId))
                      .catch(async () => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: requestRef.path, operation: 'update', requestResourceData: updateData }));
                      });
                  }}
                >
                  <XCircle className="h-4 w-4" /> DECLINE
                </Button>
              </div>
            ),
          });
        }
        
        if (change.type === "removed") {
            notifiedRequestIds.current.delete(change.doc.id);
        }
      });
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'gameRequests',
        operation: 'list',
      }));
    });

    return () => unsubscribe();
  }, [user, db, toast, dismiss]);

  return null;
}
