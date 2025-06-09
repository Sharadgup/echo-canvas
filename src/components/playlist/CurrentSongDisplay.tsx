"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Disc3, Forward } from "lucide-react";
import Image from "next/image";

interface CurrentSongDisplayProps {
  songTitle: string | null;
  onNextSong?: () => void; // Optional: if we add a "next" button here
}

export default function CurrentSongDisplay({ songTitle, onNextSong }: CurrentSongDisplayProps) {
  if (!songTitle) {
    return (
      <Card className="shadow-lg bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Disc3 className="mr-2 h-5 w-5" />
            Now Playing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>No song selected. Generate a playlist or pick a song!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Disc3 className="mr-2 h-5 w-5 animate-spin [animation-duration:3s]" />
          Now Playing
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center space-x-4">
        <Image 
            src="https://placehold.co/100x100.png" 
            alt="Current song album art" 
            width={80} 
            height={80} 
            className="rounded-md shadow-md"
            data-ai-hint="music album"
        />
        <div>
            <p className="text-2xl font-semibold">{songTitle}</p>
            <p className="text-sm opacity-80">Tune into the vibe</p>
        </div>
        {/* Optional: Add Next Song button here if needed 
        {onNextSong && (
          <Button onClick={onNextSong} variant="ghost" size="icon" className="ml-auto">
            <Forward className="h-5 w-5" />
          </Button>
        )}
        */}
      </CardContent>
    </Card>
  );
}
