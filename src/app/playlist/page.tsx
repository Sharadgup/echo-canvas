
"use client";

import { useState, useEffect } from "react";
import PlaylistGeneratorClient from "@/components/playlist/PlaylistGeneratorClient";
import SongCard from "@/components/playlist/SongCard";
import CurrentSongDisplay from "@/components/playlist/CurrentSongDisplay";
import SongSuggesterClient from "@/components/playlist/SongSuggesterClient";
import type { SuggestNextSongOutput } from "@/ai/flows/suggest-next-song";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react"; // Import PlayCircle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PlaylistPage() {
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [listeningHistory, setListeningHistory] = useState<string[]>([]);

  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/playlist");
    }
  }, [user, loading, router]);

  const handlePlaylistGenerated = (newPlaylist: string[]) => {
    setPlaylist(newPlaylist);
    if (newPlaylist.length > 0) {
      setCurrentSong(newPlaylist[0]);
      setListeningHistory(newPlaylist); // Use generated playlist as initial history
    } else {
      setCurrentSong(null);
      setListeningHistory([]);
    }
  };

  const handleSetCurrentSong = (songTitle: string) => {
    setCurrentSong(songTitle);
    if (!listeningHistory.includes(songTitle)) {
      setListeningHistory(prev => [...prev, songTitle]);
    }
  };

  const handleSongSuggested = (suggestion: SuggestNextSongOutput) => {
    // Optionally, add suggested song to playlist or offer to play next
    // For now, it's just displayed by SongSuggesterClient
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading playlist features...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Alert variant="default" className="max-w-md">
          <AlertTitle className="font-headline">Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access your playlists and music curation tools.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/playlist">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <PlaylistGeneratorClient onPlaylistGenerated={handlePlaylistGenerated} />
      </div>

      {currentSong && (
        <div>
          <CurrentSongDisplay songTitle={currentSong} />
        </div>
      )}

      {playlist.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-6 font-headline text-center">Your Generated Playlist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlist.map((songTitle, index) => (
              <SongCard
                key={`${songTitle}-${index}`}
                title={songTitle}
                onPlay={() => handleSetCurrentSong(songTitle)}
                isActive={currentSong === songTitle}
                albumArtUrl={`https://placehold.co/300x300.png?text=${encodeURIComponent(songTitle.substring(0,10))}`}
                data-ai-hint="music album"
                playButtonText={currentSong === songTitle ? "Playing" : "Set as Current"}
                playButtonIcon={PlayCircle} // Default icon
              />
            ))}
          </div>
        </div>
      )}

      {playlist.length === 0 && !currentSong && (
         <div className="text-center py-10">
            <p className="text-muted-foreground text-lg">Your playlist will appear here once generated.</p>
            <p className="text-muted-foreground text-sm">Use the form above to start your musical journey!</p>
        </div>
      )}

      <div>
        <SongSuggesterClient
          listeningHistory={listeningHistory}
          currentSong={currentSong}
          onSongSuggested={handleSongSuggested}
        />
      </div>
    </div>
  );
}
