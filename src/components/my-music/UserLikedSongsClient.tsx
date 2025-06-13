
"use client";

import { useState, useEffect, useCallback } from "react";
import { getLikedSongsAction, toggleLikeSongAction, type LikedSong } from "@/app/actions/likedMusicActions";
import SongCard from "@/components/playlist/SongCard";
import { Loader2, Music, Heart, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// Ensure YouTubeMusicSearchResult is imported if currentPlayingTrack uses its structure
import type { YouTubeMusicSearchResult } from "@/app/actions/youtubeMusicActions";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { X, Music2 } from "lucide-react"; // Music2 for player icon
import YouTubeLyricsDisplay from "@/components/youtube/YouTubeLyricsDisplay";


interface UserLikedSongsClientProps {
  userId: string;
}

export default function UserLikedSongsClient({ userId }: UserLikedSongsClientProps) {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<LikedSong | null>(null);


  const fetchLikedSongs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const songs = await getLikedSongsAction(userId);
      setLikedSongs(songs);
    } catch (err: any) {
      console.error("Error fetching liked songs:", err);
      setError("Failed to load your liked songs. Please try again.");
      toast({ title: "Error", description: "Could not fetch liked songs.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  const handleToggleLike = async (song: LikedSong) => {
    try {
      // Optimistically update UI
      setLikedSongs(prevSongs => prevSongs.filter(s => s.songId !== song.songId));
      
      await toggleLikeSongAction({
        userId,
        songId: song.songId,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnailUrl,
        source: song.source, // 'youtube' or 'uploaded'
        youtubeVideoUrl: song.source === 'youtube' ? `https://www.youtube.com/watch?v=${song.songId}` : undefined,
      });
      toast({ title: "Unliked", description: `${song.title} removed from your liked music.` });
      // No need to refetch, UI is already updated. If toggleLike also returned the new state, we could use that.
    } catch (err) {
      console.error("Error unliking song:", err);
      toast({ title: "Error", description: "Could not unlike song.", variant: "destructive" });
      // Revert optimistic update if error
      fetchLikedSongs();
    }
  };

  const handlePlaySong = (song: LikedSong) => {
    if (song.source === 'youtube') {
      setCurrentPlayingTrack(song);
    } else {
      // Placeholder for playing uploaded songs
      toast({ title: "Playback (Mock)", description: `Playing uploaded song: ${song.title}` });
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your liked music...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <Heart className="h-4 w-4" />
        <AlertTitle>Error Loading Liked Music</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {currentPlayingTrack && currentPlayingTrack.source === 'youtube' && (
         <div className="sticky top-[70px] z-20 space-y-4">
            <Card className="shadow-lg border-primary bg-background/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg font-headline">
                <span className="truncate flex items-center">
                    <Music2 className="mr-2 h-5 w-5 text-primary animate-pulse [animation-duration:1.5s]" />
                    Now Playing: {currentPlayingTrack.title}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentPlayingTrack(null)} aria-label="Close player">
                    <X className="h-5 w-5" />
                </Button>
                </CardTitle>
                <CardDescription>{currentPlayingTrack.artist}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                 {currentPlayingTrack.thumbnailUrl && (
                    <Image
                        src={currentPlayingTrack.thumbnailUrl.replace('mqdefault.jpg', 'hqdefault.jpg')}
                        alt={`Thumbnail for ${currentPlayingTrack.title}`}
                        width={320}
                        height={180}
                        className="rounded-md shadow-md mb-4"
                        data-ai-hint="music video thumbnail"
                    />
                )}
                <iframe
                    key={currentPlayingTrack.songId} // Use songId which is videoId for YouTube tracks
                    width="0"
                    height="0"
                    style={{ position: 'absolute', top: '-9999px', left: '-9999px', border: 'none' }}
                    src={`https://www.youtube.com/embed/${currentPlayingTrack.songId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title="YouTube audio player (hidden)"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
                <p className="text-sm text-muted-foreground mt-2">Audio is playing. Close player with 'X' above to stop.</p>
            </CardContent>
            </Card>
           <YouTubeLyricsDisplay
                videoId={currentPlayingTrack.songId} // songId is videoId here
                videoTitle={currentPlayingTrack.title}
            />
        </div>
      )}

      {likedSongs.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">No liked music yet.</p>
          <p className="text-sm text-muted-foreground">
            Explore music and click the <Heart className="inline h-4 w-4 text-red-500 fill-red-500" /> icon to save your favorites!
          </p>
          <Button asChild className="mt-6">
            <Link href="/search">Discover Music</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {likedSongs.map(song => (
            <SongCard
              key={song.songId + '-' + song.source} // Ensure key is unique if songId could repeat across sources
              title={song.title}
              artist={song.artist}
              albumArtUrl={song.thumbnailUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(song.title.substring(0,10))}`}
              onPlay={() => handlePlaySong(song)}
              playButtonText="Play Audio"
              playButtonIcon={Play}
              isActive={currentPlayingTrack?.songId === song.songId && currentPlayingTrack?.source === song.source}
              onLike={() => handleToggleLike(song)}
              isLiked={true} // All songs on this page are liked
              likeButtonIcon={Heart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
