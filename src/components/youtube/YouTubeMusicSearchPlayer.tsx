
"use client";

import { useState, FormEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Youtube, Play, X, Music, Heart, PlusCircle } from "lucide-react";
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";
import type { YouTubeMusicSearchResult, YouTubeMusicSearchResponse } from "@/app/actions/youtubeMusicActions";
import { searchYoutubeMusicAction } from "@/app/actions/youtubeMusicActions";

interface YouTubeMusicSearchPlayerProps {
  // Props to customize behavior or appearance if needed later
}

const predefinedInitialTracks: YouTubeMusicSearchResult[] = [
  { videoId: "kJQP7kiw5Fk", title: "Bohemian Rhapsody", artist: "Queen", thumbnailUrl: `https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=kJQP7kiw5Fk` },
  { videoId: "3tmd-ClpJxA", title: "Blinding Lights", artist: "The Weeknd", thumbnailUrl: `https://i.ytimg.com/vi/3tmd-ClpJxA/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=3tmd-ClpJxA` },
  { videoId: "hTWKbfoikeg", title: "Shape of You", artist: "Ed Sheeran", thumbnailUrl: `https://i.ytimg.com/vi/hTWKbfoikeg/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=hTWKbfoikeg` },
];


export default function YouTubeMusicSearchPlayer({}: YouTubeMusicSearchPlayerProps) {
  const [ytSearchTerm, setYtSearchTerm] = useState("");
  const [currentSearchQuery, setCurrentSearchQuery] = useState(""); // To store the term used for "Load More"
  const [ytResults, setYtResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [isYtLoading, setIsYtLoading] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [hasYtSearched, setHasYtSearched] = useState(false);
  const [currentPlayingYoutubeTrack, setCurrentPlayingYoutubeTrack] = useState<YouTubeMusicSearchResult | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

  const { toast } = useToast();

  const fetchMusic = async (term: string, pageToken?: string) => {
    if (pageToken) {
      setIsLoadMoreLoading(true);
    } else {
      setIsYtLoading(true);
      setYtResults([]); // Clear previous results for a new search
      setCurrentPlayingYoutubeTrack(null);
    }
    setHasYtSearched(true);
    setCurrentSearchQuery(term);


    try {
      const response: YouTubeMusicSearchResponse = await searchYoutubeMusicAction(term, pageToken);
      if (pageToken) {
        setYtResults(prevResults => [...prevResults, ...response.results]);
      } else {
        setYtResults(response.results);
      }
      setNextPageToken(response.nextPageToken);

      if (!pageToken && response.results.length > 0) {
        toast({ title: "YouTube Music Search Complete", description: `Found ${response.results.length} tracks.` });
      } else if (!pageToken) {
         toast({ title: "YouTube Music Search Complete", description: "No tracks found for your query." });
      }
      if (pageToken && response.results.length === 0) {
        toast({ title: "No More Results", description: "No more tracks to load for this query." });
      }

    } catch (error: any) {
      console.error("YouTube Music search error:", error);
      toast({ title: "YouTube Music Search Failed", description: error.message || "Could not fetch YouTube Music tracks.", variant: "destructive" });
    } finally {
      if (pageToken) {
        setIsLoadMoreLoading(false);
      } else {
        setIsYtLoading(false);
      }
    }
  };
  
  const handleYoutubeMusicSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ytSearchTerm.trim()) return;
    fetchMusic(ytSearchTerm);
  };

  const handleLoadMore = () => {
    if (!nextPageToken || isLoadMoreLoading) return;
    // Use currentSearchQuery for "Load More" to ensure consistency with the initial search
    // If no search was made yet (viewing predefined), use a generic term or the last search term.
    const termToFetch = currentSearchQuery || "top hits"; 
    fetchMusic(termToFetch, nextPageToken);
  };


  const handleLikeTrack = (track: YouTubeMusicSearchResult) => {
    setLikedTracks(prevLikedTracks => {
      const newLikedTracks = new Set(prevLikedTracks);
      if (newLikedTracks.has(track.videoId)) {
        newLikedTracks.delete(track.videoId);
        toast({ title: "Unliked", description: `${track.title} removed from likes.` });
      } else {
        newLikedTracks.add(track.videoId);
        toast({ title: "Liked!", description: `${track.title} added to likes.` });
      }
      return newLikedTracks;
    });
  };
  
  useEffect(() => {
    if(hasYtSearched && ytResults.length === 0 && !isYtLoading && !isLoadMoreLoading) {
        setCurrentPlayingYoutubeTrack(null);
    }
  }, [ytResults, hasYtSearched, isYtLoading, isLoadMoreLoading])

  const tracksToDisplay = hasYtSearched ? ytResults : predefinedInitialTracks;
  const displayTitle = hasYtSearched 
    ? (currentSearchQuery && ytResults.length > 0 ? `Results for "${currentSearchQuery}"` : "") 
    : "Discover Music";

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Youtube className="mr-2 h-6 w-6 text-red-500" />
            Search YouTube Music
          </CardTitle>
          <CardDescription>
            Find tracks on YouTube Music, or explore some popular choices below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleYoutubeMusicSearch} className="flex gap-2">
            <Input
              type="search"
              placeholder="Enter song or artist..."
              value={ytSearchTerm}
              onChange={(e) => setYtSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isYtLoading} variant="default">
              {isYtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentPlayingYoutubeTrack && (
        <Card className="shadow-lg border-primary sticky top-20 z-10">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-lg font-headline">
              <span className="truncate">Now Playing: {currentPlayingYoutubeTrack.title}</span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPlayingYoutubeTrack(null)} aria-label="Close player">
                <X className="h-5 w-5" />
              </Button>
            </CardTitle>
            <CardDescription>{currentPlayingYoutubeTrack.artist}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-md overflow-hidden shadow-inner">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${currentPlayingYoutubeTrack.videoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-md"
              ></iframe>
            </div>
          </CardContent>
        </Card>
      )}

      {(isYtLoading && !isLoadMoreLoading) && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Searching YouTube Music...</p>
        </div>
      )}

      {!isYtLoading && hasYtSearched && ytResults.length === 0 && !isLoadMoreLoading && !currentPlayingYoutubeTrack && (
        <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">No YouTube Music results</p>
          <p className="text-sm text-muted-foreground">
            {currentSearchQuery ? `No results for "${currentSearchQuery}". Check your search or API configuration.` : "No results found."}
          </p>
        </div>
      )}

      {tracksToDisplay.length > 0 && (
        <div className="space-y-4">
          {displayTitle && <h3 className="text-lg font-semibold">{displayTitle}</h3>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tracksToDisplay.map((track) => (
              <SongCard
                key={track.videoId + (Math.random().toString())} // Ensure unique key if IDs might repeat across pages
                title={track.title}
                artist={track.artist}
                albumArtUrl={track.thumbnailUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(track.title.substring(0,10))}`}
                data-ai-hint="youtube music thumbnail"
                onPlay={() => setCurrentPlayingYoutubeTrack(track)}
                playButtonText="Play in App"
                playButtonIcon={Play}
                isActive={currentPlayingYoutubeTrack?.videoId === track.videoId}
                onLike={() => handleLikeTrack(track)}
                isLiked={likedTracks.has(track.videoId)}
                likeButtonIcon={Heart}
              />
            ))}
          </div>
          {nextPageToken && !isYtLoading && (
            <div className="flex justify-center mt-6">
              <Button onClick={handleLoadMore} disabled={isLoadMoreLoading} variant="outline" size="lg">
                {isLoadMoreLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Load More Results
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {!isYtLoading && !hasYtSearched && tracksToDisplay.length === 0 && !currentPlayingYoutubeTrack && (
         <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Search for tracks on YouTube Music</p>
            <p className="text-sm text-muted-foreground">Enter a song or artist above to begin, or explore suggested tracks.</p>
        </div>
      )}
    </div>
  );
}

