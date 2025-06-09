"use client";

import MusicVisualizerClient from "@/components/visualizer/MusicVisualizerClient";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function VisualizerPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/visualizer");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading visualizer...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Alert variant="default" className="max-w-md">
          <AlertTitle className="font-headline">Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to experience the music visualizer.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/visualizer">Login</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="py-8">
      <MusicVisualizerClient />
    </div>
  );
}
