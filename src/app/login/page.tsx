"use client";

import AuthForm from "@/components/auth/AuthForm";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && user) {
      router.push("/profile");
    }
  }, [user, loading, router]);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Login successful", description: "Welcome back!" });
      router.push("/profile");
    } catch (error: any) {
      // Error handling is done in AuthForm, but can be customized here if needed
      throw error; // Re-throw to be caught by AuthForm
    }
  };
  
  if (loading || (!loading && user)) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><p>Loading...</p></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login to Echo Canvas</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" onSubmit={handleLogin} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button variant="link" asChild className="px-0">
              <Link href="/signup">Sign up</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
