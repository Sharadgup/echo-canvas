"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Loader2, UserCircle, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, loading, isUserProcessing, setIsUserProcessing } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setIsUserProcessing(true);
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    } finally {
      setIsUserProcessing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <UserCircle className="mx-auto h-20 w-20 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Your Profile</CardTitle>
          <CardDescription>Manage your Echo Canvas account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Email</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">User ID</h3>
            <p className="text-muted-foreground text-sm">{user.uid}</p>
          </div>
          <div className="pt-4">
            <h3 className="font-semibold text-lg mb-2">Liked Songs</h3>
            <p className="text-muted-foreground text-sm">This feature is coming soon! You'll be able to see your saved favorite tracks here.</p>
          </div>
          <div className="pt-4">
            <h3 className="font-semibold text-lg mb-2">Preferences</h3>
            <p className="text-muted-foreground text-sm">Personalize your Echo Canvas experience. More settings coming soon.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleLogout} className="w-full" disabled={isUserProcessing}>
            <LogOut className="mr-2 h-4 w-4" />
            {isUserProcessing ? "Logging out..." : "Logout"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
