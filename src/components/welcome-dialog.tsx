
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import placeholderImages from "@/app/lib/placeholder-images.json";

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome");

  useEffect(() => {
    if (welcome === "true") {
      setIsOpen(true);
      // Clean up the URL after showing the dialog
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [welcome]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md flex flex-col items-center text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Welcome to CollegeConnect! 🎉</DialogTitle>
          <DialogDescription className="text-base">
            Congratulations on joining our community! Ready to connect, share, and succeed with your fellow students?
          </DialogDescription>
        </DialogHeader>
        <div className="relative mt-4 overflow-hidden rounded-lg p-4 bg-muted/30">
          <Image
            src={placeholderImages.welcomeStudent.src}
            alt={placeholderImages.welcomeStudent.alt}
            width={placeholderImages.welcomeStudent.width}
            height={placeholderImages.welcomeStudent.height}
            data-ai-hint={placeholderImages.welcomeStudent.hint}
            className="object-contain transition-transform hover:scale-105 duration-500 max-h-[300px] w-auto mx-auto"
            unoptimized={true}
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground font-medium italic">
          "Your journey to greatness starts here!"
        </p>
      </DialogContent>
    </Dialog>
  );
}
