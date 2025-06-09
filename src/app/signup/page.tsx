"use client";

import AuthForm from "@/components/auth/AuthForm";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && user) {
      router.push("/profile");
    }
  }, [user, loading, router]);

  const handleSignup = async (values: { email: string; password: string }) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Signup successful", description: "Welcome to Echo Canvas!" });
      router.push("/profile"); 
    } catch (error: any) {
      // Error handling is done in AuthForm
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
          <CardTitle className="text-2xl font-headline">Create your Echo Canvas Account</CardTitle>
          <CardDescription>Join us to discover and visualize music.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="signup" onSubmit={handleSignup} />
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
