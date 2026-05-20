
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, HelpCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <HelpCircle className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Support & Help</h1>
      </div>
      
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Voice Support */}
            <Card className="bg-muted/30 border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">Call Support</p>
                  <p className="text-muted-foreground text-sm mb-4">Immediate assistance via voice call</p>
                  <p className="text-xl font-black text-primary tracking-tight">9902132933</p>
                </div>
                <Button asChild className="w-full mt-2" variant="default">
                  <a href="tel:9902132933">Call Now</a>
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp Support */}
            <Card className="bg-green-50/50 dark:bg-green-900/5 border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-lg text-green-700 dark:text-green-400">WhatsApp Us</p>
                  <p className="text-muted-foreground text-sm mb-4">Chat with us anytime on WhatsApp</p>
                  <p className="text-xl font-black text-green-600 tracking-tight">9902132933</p>
                </div>
                <Button asChild className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white">
                  <a href="https://wa.me/919902132933" target="_blank" rel="noopener noreferrer">
                    Send Message
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* X (Twitter) Support */}
            <Card className="bg-slate-950 dark:bg-slate-900 border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3 text-white">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                   <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                     <path d="M18.244 2.25h3.308l-7.227 7.717L22.875 22.5h-6.656l-5.212-6.817L4.99 22.5H1.68l7.73-8.235L1.25 2.25h6.826l4.704 6.158L18.244 2.25zm-1.161 18.27h1.833L7.084 4.126H5.117L17.083 20.52z" />
                   </svg>
                </div>
                <div>
                  <p className="font-bold text-lg">Reach on X</p>
                  <p className="text-slate-400 text-sm mb-4">Latest updates & direct support</p>
                  <p className="text-xl font-black text-white tracking-tight">@samrudhvx</p>
                </div>
                <Button asChild className="w-full mt-2 bg-white text-black hover:bg-slate-200">
                  <a href="https://x.com/samrudhvx" target="_blank" rel="noopener noreferrer">
                    Visit Profile
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Support Hours: <span className="text-foreground font-bold">Available 24/7</span>
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              For security reasons, do not share your password with anyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
