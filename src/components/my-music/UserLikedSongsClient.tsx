
"use client";

import { useState, useEffect, useCallback } from "react";
import { getLikedSongsAction, toggleLikeSongAction, type LikedSong } from "@/app/actions/likedMusicActions";
import SongCard from "@/components/playlist/SongCard";
import { Loader2, Music, Heart, Play, X, Music2, ChevronDown, ChevronUp, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [isPlayerBarPlaying, setIsPlayerBarPlaying] = useState(false);


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
      setLikedSongs(prevSongs => prevSongs.filter(s => s.songId !== song.songId && s.source === song.source));
      if (currentPlayingTrack?.songId === song.songId && currentPlayingTrack?.source === song.source) {
        // If the unliked song is currently playing, close the player
        handleClosePlayer();
      }

      await toggleLikeSongAction({
        userId,
        songId: song.songId,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnailUrl,
        source: song.source,
        youtubeVideoUrl: song.source === 'youtube' ? `https://www.youtube.com/watch?v=${song.songId}` : undefined,
      });
      toast({ title: "Unliked", description: `${song.title} removed from your liked music.` });
    } catch (err) {
      console.error("Error unliking song:", err);
      toast({ title: "Error", description: "Could not unlike song.", variant: "destructive" });
      fetchLikedSongs(); // Revert optimistic update if error
    }
  };

  const handleSelectTrackForPlayer = (song: LikedSong) => {
    if (song.source === 'youtube') {
      setCurrentPlayingTrack(song);
      setIsPlayerMinimized(false);
      setIsPlayerBarPlaying(true);
    } else {
      toast({ title: "Playback (Mock)", description: `Playing uploaded song: ${song.title}. Full player for uploaded songs coming soon!` });
      // Potentially set currentPlayingTrack for uploaded songs if a generic player is implemented
    }
  };

  const handleTogglePlayerBarPlayPause = () => {
    if (!currentPlayingTrack) return;
    setIsPlayerBarPlaying(!isPlayerBarPlaying);
  };

  const handleMinimizePlayer = () => setIsPlayerMinimized(true);
  const handleMaximizePlayer = () => setIsPlayerMinimized(false);

  const handleClosePlayer = () => {
    setCurrentPlayingTrack(null);
    setIsPlayerBarPlaying(false);
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
         <div className="sticky top-[70px] z-30 space-y-2">
          {!isPlayerMinimized ? (
            // MAXIMIZED PLAYER
            <Card className="shadow-xl border-primary bg-background/95 backdrop-blur-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-lg font-headline truncate">
                    <Music2 className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                     <span className="truncate" title={currentPlayingTrack.title}>
                        Now Playing: {currentPlayingTrack.title}
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={handleTogglePlayerBarPlayPause} aria-label={isPlayerBarPlaying ? "Pause" : "Play"}>
                      {isPlayerBarPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleMinimizePlayer} aria-label="Minimize player">
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleClosePlayer} aria-label="Close player">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="truncate" title={currentPlayingTrack.artist || 'Unknown Artist'}>{currentPlayingTrack.artist || 'Unknown Artist'}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-2">
                 {currentPlayingTrack.thumbnailUrl && (
                    <Image
                        src={currentPlayingTrack.thumbnailUrl.replace('mqdefault.jpg', 'hqdefault.jpg')}
                        alt={`Thumbnail for ${currentPlayingTrack.title}`}
                        width={320}
                        height={180}
                        className="rounded-md shadow-md mb-4"
                        data-ai-hint="music video thumbnail"
                        priority={true}
                    />
                )}
                {isPlayerBarPlaying && (
                  <iframe
                    key={currentPlayingTrack.songId + "-liked-player"}
                    width="0"
                    height="0"
                    style={{ position: 'absolute', top: '-9999px', left: '-9999px', border: 'none' }}
                    src={`https://www.youtube.com/embed/${currentPlayingTrack.songId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title="YouTube audio player (hidden)"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  ></iframe>
                )}
                 {!isPlayerBarPlaying && (
                    <div className="w-full h-[180px] bg-muted flex items-center justify-center rounded-md my-4">
                        <p className="text-muted-foreground">Paused</p>
                    </div>
                 )}
              </CardContent>
              {isPlayerBarPlaying && (
                <YouTubeLyricsDisplay
                    videoId={currentPlayingTrack.songId}
                    videoTitle={currentPlayingTrack.title}
                />
              )}
            </Card>
          ) : (
            // MINIMIZED PLAYER
            <Card className="shadow-lg bg-background/95 backdrop-blur-md p-2">
              <div className="flex items-center justify-between space-x-2">
                {currentPlayingTrack.thumbnailUrl && (
                  <Image
                    src={currentPlayingTrack.thumbnailUrl}
                    alt="mini thumbnail"
                    width={40}
                    height={40}
                    className="rounded flex-shrink-0"
                    data-ai-hint="song thumbnail"
                  />
                )}
                <div className="flex-grow overflow-hidden mx-2">
                  <p className="text-sm font-semibold truncate" title={currentPlayingTrack.title}>{currentPlayingTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate" title={currentPlayingTrack.artist || 'Unknown Artist'}>{currentPlayingTrack.artist || 'Unknown Artist'}</p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={handleTogglePlayerBarPlayPause} aria-label={isPlayerBarPlaying ? "Pause" : "Play"}>
                    {isPlayerBarPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleMaximizePlayer} aria-label="Maximize player">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleClosePlayer} aria-label="Close player">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
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
              key={song.songId + '-' + song.source}
              title={song.title}
              artist={song.artist}
              albumArtUrl={song.thumbnailUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(song.title.substring(0,10))}`}
              data-ai-hint={song.source === 'youtube' ? "youtube music" : "uploaded music"}
              onPlay={() => handleSelectTrackForPlayer(song)}
              playButtonText="Play Audio"
              playButtonIcon={Play}
              isActive={currentPlayingTrack?.songId === song.songId && currentPlayingTrack?.source === song.source && isPlayerBarPlaying}
              onLike={() => handleToggleLike(song)}
              isLiked={true} 
              likeButtonIcon={Heart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
