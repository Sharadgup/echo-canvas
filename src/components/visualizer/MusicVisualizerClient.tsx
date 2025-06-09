"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, SkipForward, Music2 } from "lucide-react";

// Helper function to get a random item from an array
const getRandomElement = <T,>(arr: T[]): T | undefined => {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};


const placeholderSongs = [
  "Bohemian Rhapsody - Queen",
  "Stairway to Heaven - Led Zeppelin",
  "Imagine - John Lennon",
  "Like a Rolling Stone - Bob Dylan",
  "Hey Jude - The Beatles",
  "Smells Like Teen Spirit - Nirvana",
  "Billie Jean - Michael Jackson",
  "Hotel California - Eagles",
  "Sweet Child O' Mine - Guns N' Roses",
  "Wonderwall - Oasis"
];


export default function MusicVisualizerClient() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<string | null>(null);

  useEffect(() => {
    // Pick a random song on mount
    setCurrentSong(getRandomElement(placeholderSongs) || "Placeholder Song Title");
  }, []);
  
  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextSong = () => {
     setCurrentSong(getRandomElement(placeholderSongs.filter(s => s !== currentSong)) || "Another Placeholder Song");
     setIsPlaying(true); // Auto-play next song
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl flex items-center justify-center">
          <Music2 className="mr-3 h-8 w-8 text-primary" />
          Dynamic Music Visualizer
        </CardTitle>
        <CardDescription>
          {currentSong ? `Now Playing: ${currentSong}` : "No song selected"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center my-6 relative overflow-hidden">
          {/* Placeholder Visualization */}
          {isPlaying ? (
            <div className="pulsating-circle" />
          ) : (
            <p className="text-muted-foreground">Paused</p>
          )}
           <div className="absolute inset-0 flex items-center justify-center space-x-2 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/10">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 bg-accent/70 animate-pulse"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${isPlaying ? (Math.random() * 0.5 + 0.5) : 3}s`,
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-center items-center space-x-4 mt-8">
          <Button onClick={togglePlay} variant="default" size="lg" className="rounded-full w-20 h-20 shadow-lg">
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
          </Button>
          <Button onClick={nextSong} variant="outline" size="lg" className="rounded-full w-16 h-16 shadow-md">
            <SkipForward className="h-6 w-6" />
            <span className="sr-only">Next Song</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6">
          This is a placeholder visualizer. Actual music playback is not implemented.
        </p>
      </CardContent>
    </Card>
  );
}
