"use client";
import SearchClient from "@/components/search/SearchClient";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="py-8">
      <SearchClient />
    </div>
  );
}
