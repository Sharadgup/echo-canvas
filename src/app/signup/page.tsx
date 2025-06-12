
"use client";

import AuthForm from "@/components/auth/AuthForm";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Google Icon SVG (can be moved to a shared components folder later)
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, setIsUserProcessing } = useAuthContext();

  useEffect(() => {
    if (!loading && user) {
      router.push("/profile");
    }
  }, [user, loading, router]);

  const handleSignup = async (values: { email: string; password: string }) => {
    try {
      if (!auth) {
        toast({
          title: "Sign-up Error",
          description: "Authentication service is not available. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Signup successful", description: "Welcome to Echo Canvas!" });
      router.push("/profile"); 
    } catch (error: any) {
      throw error;
    }
  };

  const handleGoogleSignup = async () => {
    setIsUserProcessing(true);
    if (!auth || !googleProvider) {
      toast({
        title: "Google Sign-up Failed",
        description: "Google Sign-Up is currently unavailable due to a configuration issue. Please try again later or contact support.",
        variant: "destructive",
      });
      setIsUserProcessing(false);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Signup successful", description: "Welcome to Echo Canvas with Google!" });
      router.push("/profile");
    } catch (error: any) {
      console.error("Google signup error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast({ title: "Google Signup Canceled", description: "You closed the Google Sign-Up window before completing the process.", variant: "default" });
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast({ title: "Google Signup Canceled", description: "Multiple Google Sign-Up windows were opened. Please try again.", variant: "default" });
      } else if (error.code === 'auth/popup-blocked') {
        toast({ title: "Google Signup Blocked", description: "Your browser blocked the Google Sign-Up popup. Please disable your popup blocker for this site and try again.", variant: "destructive" });
      }
      else {
        toast({ title: "Google Signup Failed", description: error.message || "Could not sign up with Google. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsUserProcessing(false);
    }
  };

  if (loading || (!loading && user)) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><p>Loading...</p></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create your Echo Canvas Account</CardTitle>
          <CardDescription>Join us to discover and visualize music, using email or Google.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="signup" onSubmit={handleSignup} />
          <div className="my-6 flex items-center">
            <Separator className="flex-grow" />
            <span className="mx-4 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-grow" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
            <GoogleIcon />
            Sign up with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" asChild className="px-0">
              <Link href="/login">Login</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
