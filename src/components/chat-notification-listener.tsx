"use client";

import { useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import type { ChatConversation, Message } from "@/types/firestore";

export default function ChatNotificationListener() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const lastProcessedMessageIds = useRef<Set<string>>(new Set());

  // Listen to all conversations the user is a participant of
  const conversationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "chatConversations"),
      where("participantIds", "array-contains", user.uid)
    );
  }, [db, user]);

  const { data: conversations } = useCollection<ChatConversation>(conversationsQuery);

  useEffect(() => {
    if (!user || !db || !conversations) return;

    const unsubscribers: (() => void)[] = [];

    // Create a listener for messages in each conversation
    conversations.forEach((conv) => {
      // Defensive check for conversation ID
      if (!conv.id) return;

      const messagesQuery = query(
        collection(db, "chatConversations", conv.id, "messages"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const message = { id: change.doc.id, ...change.doc.data() } as Message;

            const isSelf = message.senderId === user.uid;
            const isNew = message.timestamp && (Date.now() - message.timestamp.toMillis() < 5000);
            const isDuplicate = lastProcessedMessageIds.current.has(message.id);
            const isViewingThisChat = pathname === '/chat' && new URLSearchParams(window.location.search).get('id') === conv.id;

            if (!isSelf && isNew && !isDuplicate && !isViewingThisChat) {
              lastProcessedMessageIds.current.add(message.id);
              
              toast({
                title: `New Message in ${conv.name || 'Group'}`,
                description: (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-primary">{message.senderName}:</p>
                    <p className="text-xs italic line-clamp-1">"{message.text || (message.fileUrl ? 'Shared a file' : '...')}"</p>
                  </div>
                ),
                action: (
                  <button 
                    onClick={() => router.push(`/chat?id=${conv.id}`)}
                    className="bg-primary text-white text-[10px] font-black italic px-3 py-1.5 rounded-lg uppercase tracking-tight"
                  >
                    View Chat
                  </button>
                ),
                duration: 5000,
              });
            }
          }
        });
      }, (err) => {
        // Defensive: Stop listener on permission error to prevent crash loop, but don't emit global crash for background sync
        console.warn(`Notification listener for ${conv.id} suspended: ${err.message}`);
      });

      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [user, db, conversations, toast, router, pathname]);

  return null;
}