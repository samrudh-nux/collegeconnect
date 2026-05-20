"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc } from "firebase/firestore";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, GraduationCap, ShieldCheck, RefreshCw, KeyRound, ArrowLeft, Fingerprint, UserPlus, LogIn, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  
  // OTP State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtpInput, setUserOtpInput] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  // High-Speed Matrix Prefetch: Warm up all primary routes during the handshake
  useEffect(() => {
    if (isOtpStep || email.length > 5) {
        router.prefetch("/avatar-selection");
        router.prefetch("/feed");
        router.prefetch("/chat");
        router.prefetch("/courses");
        router.prefetch("/connect");
    }
  }, [isOtpStep, email, router]);

  // Initial warming
  useEffect(() => {
    router.prefetch("/avatar-selection");
    router.prefetch("/feed");
  }, [router]);

  // Handle Resend Cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const generateAndSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsOtpStep(true);
    
    toast({
      title: "Security Code Transmitted! 🛰️",
      description: (
        <div className="mt-2 p-4 bg-primary/10 rounded-xl border-2 border-primary/20 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Incoming Verification Shard:</p>
          <p className="text-4xl font-black italic tracking-[0.25em] text-primary drop-shadow-sm">{code}</p>
          <p className="text-[8px] font-bold text-primary/60 uppercase mt-2">DO NOT SHARE THIS TOKEN</p>
        </div>
      ),
      duration: 15000,
    });
  };

  const handleInitialAuth = async () => {
    if (!auth || !db) return;

    if (email.trim() === "" || password.trim() === "") {
        toast({
            variant: "destructive",
            title: "Credentials Missing",
            description: "Please provide valid identity tokens.",
        });
        return;
    }

    if (isRegister && password.length < 6) {
        toast({
            variant: "destructive",
            title: "Security Vulnerability",
            description: "Password must be at least 6 characters.",
        });
        return;
    }

    setIsLoading(true);
    generateAndSendOtp();
    setIsLoading(false);
  };

  const verifyOtpAndProceed = async () => {
    if (userOtpInput.trim() !== generatedOtp.trim()) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "The provided OTP shard does not match our records.",
      });
      setUserOtpInput("");
      return;
    }

    setIsLoading(true);

    if (isRegister) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const defaultAvatar = `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.uid}`;
        
        const userProfileData: UserProfile = {
          id: user.uid,
          email: user.email || '',
          firstName: user.email?.split('@')[0] || 'Student',
          lastName: '',
          collegeId: 'default',
          highScore: 0,
          badgeNames: [],
          enrolledCourseIds: [],
          profileImageUrl: defaultAvatar,
        };
        
        const userDocRef = doc(db, "userProfiles", user.uid);
        
        // Zero-Wait hand-off: Parallel execution path for instant transition
        updateProfile(user, { photoURL: defaultAvatar }).catch(() => {});
        setDocumentNonBlocking(userDocRef, userProfileData, { merge: true });
        
        // Instant Redirect to Matrix (Zero-Lag Router)
        router.push("/avatar-selection?welcome=true");
        
        toast({
            title: "Identity Verified! 🚀",
            description: "Account secured. Initializing Persona Matrix.",
        });

      } catch (error: any) {
        toast({ variant: "destructive", title: "Registration Denied", description: error.message });
        setIsLoading(false);
        setIsOtpStep(false);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Instant Dashboard Transition (Zero-Lag Router)
        router.push("/feed?welcome=true");
        toast({ title: "Welcome Back! 💎", description: "Identity confirmed. Synchronizing dashboard." });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Access Denied", description: "Invalid credentials detected." });
        setIsLoading(false);
        setIsOtpStep(false);
      }
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    generateAndSendOtp();
  };

  return (
    <div className="w-full max-w-md">
      {!isOtpStep ? (
        <Card className="border-none shadow-3xl bg-card/40 backdrop-blur-2xl rounded-[3rem] overflow-hidden ring-1 ring-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-32 w-full bg-gradient-to-br from-primary via-accent to-purple-600 relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                <svg width="100%" height="100%"><defs><pattern id="grid-login" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid-login)" /></svg>
             </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-white drop-shadow-2xl animate-bounce-slow" />
             </div>
          </div>
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-4xl font-black italic tracking-tighter uppercase text-foreground">CollegeConnect</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-1">
              {isRegister ? "Forge Your Digital Identity" : "Secure Network Gateway"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-8 pb-4">
            <div className="grid gap-2.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Network Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@college.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-14 bg-background/50 border-2 rounded-2xl font-bold uppercase tracking-tight focus:border-primary transition-all shadow-inner"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="password" title="Security Password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleInitialAuth()}
                className="h-14 bg-background/50 border-2 rounded-2xl font-bold tracking-tight focus:border-primary transition-all shadow-inner"
              />
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest ml-1">
                {isRegister ? "Minimum 6 characters required." : "Enter your operator credentials."}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-10">
            <Button
              onClick={handleInitialAuth}
              className="w-full h-16 text-xl font-black italic uppercase tracking-tighter shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 rounded-[1.5rem] bg-gradient-to-r from-primary to-accent"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : isRegister ? <UserPlus className="mr-3 h-6 w-6" /> : <LogIn className="mr-3 h-6 w-6" />}
              {isRegister ? "Initiate Onboarding" : "Authenticate Access"}
            </Button>
            
            <div className="flex flex-col items-center gap-2">
                <div className="w-full h-px bg-border/50 relative my-2">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">or</span>
                </div>
                <Button
                  onClick={() => {
                      setIsRegister(!isRegister);
                      setEmail("");
                      setPassword("");
                  }}
                  variant="ghost"
                  className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all h-10 rounded-xl"
                  disabled={isLoading}
                >
                  {isRegister ? "Already registered? Log In." : "New recruit? Join now."}
                </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-none shadow-3xl bg-card/40 backdrop-blur-2xl rounded-[3rem] overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-500">
          <CardHeader className="text-center p-8 bg-primary/10 border-b border-primary/10">
            <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/20 rounded-[2rem] shadow-inner">
                    <KeyRound className="h-10 w-10 text-primary animate-pulse" />
                </div>
            </div>
            <CardTitle className="text-3xl font-black italic tracking-tighter uppercase text-foreground">Verify Identity</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-tighter text-primary mt-2">
              Enter the 6-digit transmission code
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-full">
                    <Input
                        value={userOtpInput}
                        onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="h-20 text-center text-4xl font-black tracking-[0.5em] bg-background/50 border-4 border-dashed border-primary/20 rounded-[1.5rem] focus:border-primary focus:border-solid transition-all shadow-inner"
                        disabled={isLoading}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && userOtpInput.length === 6 && verifyOtpAndProceed()}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                        <Fingerprint className="h-8 w-8 text-primary" />
                    </div>
                </div>
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Decrypting Handshake...</p>
                    </div>
                ) : (
                    <p className="text-[11px] font-medium text-muted-foreground text-center italic leading-relaxed px-4">
                        A security shard has been transmitted to <span className="text-primary font-bold not-italic">{email}</span>.
                    </p>
                )}
            </div>
            
            <div className="flex flex-col gap-4">
                <Button
                    onClick={verifyOtpAndProceed}
                    className="w-full h-16 text-2xl font-black italic uppercase tracking-tighter shadow-2xl shadow-primary/30 rounded-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]"
                    disabled={isLoading || userOtpInput.length !== 6}
                >
                    {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Sparkles className="mr-3 h-6 w-6" />}
                    {isLoading ? "Synchronizing..." : "Verify Access"}
                </Button>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleResend}
                        disabled={isLoading || resendTimer > 0}
                        className="flex-1 h-12 rounded-xl font-black uppercase italic tracking-widest text-[10px] border-2"
                    >
                        {resendTimer > 0 ? (
                            <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                {resendTimer}s
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Resend
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setIsOtpStep(false);
                            setUserOtpInput("");
                            setGeneratedOtp("");
                        }}
                        disabled={isLoading}
                        className="px-6 h-12 rounded-xl font-black uppercase italic tracking-widest text-[10px] hover:bg-muted"
                    >
                        <ArrowLeft className="mr-2 h-3 w-3" /> Back
                    </Button>
                </div>
            </div>
          </CardContent>
          <div className="p-6 bg-muted/20 border-t flex items-center justify-center gap-2">
             <ShieldCheck className="h-4 w-4 text-green-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Encrypted transmission active</span>
          </div>
        </Card>
      )}
    </div>
  );
}