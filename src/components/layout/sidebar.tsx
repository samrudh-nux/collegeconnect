
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Trophy,
  User,
  Users,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/feed", icon: LayoutDashboard, label: "Share Feed" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/courses", icon: BookOpen, label: "Courses" },
  { href: "/connect", icon: Users, label: "Connect" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/games", icon: Gamepad2, label: "Games" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/support", icon: HelpCircle, label: "Support" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r bg-card p-2">
      <TooltipProvider>
        <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-primary"/>
        </div>
        <nav className="mt-8 flex flex-1 flex-col items-center gap-4">
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
}
