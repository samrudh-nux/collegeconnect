"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/sidebar";
import GameRequestListener from "@/components/game-request-listener";
import ChatNotificationListener from "@/components/chat-notification-listener";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // High-Speed Matrix Prefetch: Warm up all primary routes for zero-lag navigation
  useEffect(() => {
    const mainRoutes = ['/feed', '/chat', '/courses', '/connect', '/documents', '/games', '/profile', '/leaderboard', '/support'];
    mainRoutes.forEach(route => router.prefetch(route));
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background/50">
        {children}
      </main>
      <GameRequestListener />
      <ChatNotificationListener />
    </div>
  );
}
