
"use client";

import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, LogIn, Music, Disc3, Search } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Music className="h-16 w-16 text-primary animate-pulse mb-4" />
        <p className="text-xl font-semibold">Loading Echo Canvas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
      <div className="mb-8">
        <Image
          src="https://placehold.co/600x400.png"
          alt="Person enjoying music with headphones and visual sound waves"
          width={600}
          height={400}
          className="rounded-lg shadow-xl"
          data-ai-hint="headphones music"
          priority
        />
      </div>
      <h1 className="text-5xl font-bold font-headline mb-6 text-primary">
        Welcome to Echo Canvas
      </h1>
      <p className="text-xl text-foreground max-w-2xl mb-10">
        Discover, visualize, and curate music like never before with AI-powered suggestions and dynamic visuals.
      </p>

      {user ? (
        <div className="space-y-6">
          <p className="text-lg">
            Welcome back, <span className="font-semibold text-accent">{user.email}</span>!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/dashboard" className="flex items-center justify-center">
                <Disc3 className="mr-2 h-5 w-5" /> My Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/my-music" className="flex items-center justify-center">
                <Music className="mr-2 h-5 w-5" /> My Music
              </Link>
            </Button>
             <Button asChild size="lg" variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/search" className="flex items-center justify-center">
                <Search className="mr-2 h-5 w-5" /> Search Music
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-lg">
            Login or Sign up to craft your unique soundscape.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/signup">
                Sign Up <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="mt-16 p-6 border rounded-lg shadow-lg bg-card max-w-3xl">
        <h2 className="text-2xl font-semibold mb-3 font-headline text-accent">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-left text-card-foreground">
          <li><strong className="text-primary">Record or Describe:</strong> Use your voice, a sound, or describe your music taste.</li>
          <li><strong className="text-primary">AI Analysis & Search:</strong> Our AI understands your input and finds matching music.</li>
          <li><strong className="text-primary">Curated Results:</strong> Get personalized song suggestions and YouTube results.</li>
          <li><strong className="text-primary">Like & Collect:</strong> Save your favorite tracks to "My Music".</li>
        </ol>
      </div>
    </div>
  );
}
