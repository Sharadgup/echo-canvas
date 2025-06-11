
"use client";
import SearchClient from "@/components/search/SearchClient"; // For Mock Search
import YouTubeMusicSearchPlayer from "@/components/youtube/YouTubeMusicSearchPlayer"; // New component
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Music } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";


export default function SearchPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/search");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading search...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Alert variant="default" className="max-w-md">
          <AlertTitle className="font-headline">Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to search for music.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/search">Login</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="py-8 space-y-12">
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader className="text-center">
            <Music className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-3xl font-headline">Find Your Music</CardTitle>
            <CardDescription>
                Search for songs using our internal mock search or explore YouTube Music.
            </CardDescription>
        </CardHeader>
      </Card>
      
      {/* YouTube Music Search and Player */}
      <YouTubeMusicSearchPlayer />

      <Separator className="my-12" />

      {/* Mock Search Section - Kept from original SearchClient */}
      <SearchClient /> 
    </div>
  );
}
