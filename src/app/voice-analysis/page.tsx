
"use client";

import VoiceAnalyzerClient from "@/components/voice-analysis/VoiceAnalyzerClient";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Mic } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VoiceAnalysisPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/voice-analysis");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading Voice Analysis...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Alert variant="default" className="max-w-md">
          <AlertTitle className="font-headline">Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to use the Voice Analysis feature.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/voice-analysis">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
            <Mic className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-3xl font-headline">Voice & Sound Analysis</CardTitle>
            <CardDescription>
                Record your voice or a sound, and let AI analyze it to find related music on YouTube.
            </CardDescription>
        </CardHeader>
      </Card>
      <VoiceAnalyzerClient />
    </div>
  );
}
