
"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Music, Heart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UserLikedSongsClient from "@/components/my-music/UserLikedSongsClient";

export default function MyMusicPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/my-music");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your music...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Alert variant="default" className="max-w-md">
          <AlertTitle className="font-headline">Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view your liked music.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/my-music">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-3xl font-headline">My Liked Music</CardTitle>
            <CardDescription>
                All your favorite tracks in one place.
            </CardDescription>
        </CardHeader>
      </Card>
      {user && <UserLikedSongsClient userId={user.uid} />}
    </div>
  );
}
