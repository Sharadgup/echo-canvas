
"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Youtube, Play, X, Music, Heart } from "lucide-react";
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";
import type { YouTubeMusicSearchResult, YouTubeMusicSearchResponse } from "@/app/actions/youtubeMusicActions";
import { searchYoutubeMusicAction } from "@/app/actions/youtubeMusicActions";

const DEFAULT_DISCOVER_QUERY = "Top Music Hits";

export default function YouTubeMusicSearchPlayer() {
  const [ytSearchTerm, setYtSearchTerm] = useState("");
  const [currentSearchQuery, setCurrentSearchQuery] = useState(DEFAULT_DISCOVER_QUERY);
  const [ytResults, setYtResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For initial discover load or first search
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [hasLoadedInitialDiscover, setHasLoadedInitialDiscover] = useState(false);
  const [currentPlayingYoutubeTrack, setCurrentPlayingYoutubeTrack] = useState<YouTubeMusicSearchResult | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

  const { toast } = useToast();
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchMusic = useCallback(async (term: string, pageToken?: string, isDiscoverLoad: boolean = false) => {
    if (isDiscoverLoad || !pageToken) { // Initial load or new search
      setIsLoading(true);
      setYtResults([]);
      setCurrentPlayingYoutubeTrack(null);
    } else { // Load more
      setIsLoadMoreLoading(true);
    }
    
    setCurrentSearchQuery(term);

    try {
      const response: YouTubeMusicSearchResponse = await searchYoutubeMusicAction(term, pageToken);
      
      setYtResults(prevResults => pageToken ? [...prevResults, ...response.results] : response.results);
      setNextPageToken(response.nextPageToken);

      if (!pageToken && !isDiscoverLoad) { // New search result toast
        toast({ title: "YouTube Music Search Complete", description: `Found ${response.results.length} tracks.` });
      } else if (!pageToken && isDiscoverLoad && response.results.length === 0) {
        toast({ title: "Discover Empty", description: "Could not fetch initial discover tracks." });
      }
       if (pageToken && response.results.length === 0) {
        // This is normal for infinite scroll when no more results
        // toast({ title: "No More Results", description: "No more tracks to load for this query." });
      }
      if (isDiscoverLoad) setHasLoadedInitialDiscover(true);

    } catch (error: any) {
      console.error("YouTube Music search error:", error);
      toast({ title: "YouTube Music Search Failed", description: error.message || "Could not fetch YouTube Music tracks.", variant: "destructive" });
    } finally {
      if (isDiscoverLoad || !pageToken) {
        setIsLoading(false);
      } else {
        setIsLoadMoreLoading(false);
      }
    }
  }, [toast]);
  
  // Initial Discover Load
  useEffect(() => {
    if (!hasLoadedInitialDiscover) {
      fetchMusic(DEFAULT_DISCOVER_QUERY, undefined, true);
    }
  }, [fetchMusic, hasLoadedInitialDiscover]);


  // Infinite Scroll Intersection Observer
  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPageToken && !isLoadMoreLoading && !isLoading) {
        fetchMusic(currentSearchQuery, nextPageToken);
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [nextPageToken, isLoadMoreLoading, isLoading, currentSearchQuery, fetchMusic]);


  const handleYoutubeMusicSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ytSearchTerm.trim()) {
        // If search is cleared, reload discover feed
        setHasLoadedInitialDiscover(false); // Trigger reload of discover
        fetchMusic(DEFAULT_DISCOVER_QUERY, undefined, true);
        return;
    }
    setYtSearchTerm(ytSearchTerm.trim()); // Update to trimmed search term
    fetchMusic(ytSearchTerm.trim()); // New search, no pageToken
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
  
  const displayTitle = currentSearchQuery === DEFAULT_DISCOVER_QUERY && hasLoadedInitialDiscover
    ? "Discover Music" 
    : (ytResults.length > 0 ? `Results for "${currentSearchQuery}"` : "");

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
            <Button type="submit" disabled={isLoading && ytSearchTerm.trim() !== ""} variant="default">
              {(isLoading && ytSearchTerm.trim() !== "") ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
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

      {(isLoading && ytResults.length === 0) && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading YouTube Music...</p>
        </div>
      )}

      {!isLoading && ytResults.length === 0 && hasLoadedInitialDiscover && (
        <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">No YouTube Music results</p>
          <p className="text-sm text-muted-foreground">
            {currentSearchQuery !== DEFAULT_DISCOVER_QUERY ? `No results for "${currentSearchQuery}". Check your search or API configuration.` : "Could not load discover tracks."}
          </p>
        </div>
      )}

      {ytResults.length > 0 && (
        <div className="space-y-4">
          {displayTitle && <h3 className="text-lg font-semibold">{displayTitle}</h3>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ytResults.map((track) => (
              <SongCard
                key={track.videoId + track.title + (Math.random().toString())} 
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
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {isLoadMoreLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          </div>
        </div>
      )}
      
      {!isLoading && !hasLoadedInitialDiscover && ytResults.length === 0 && (
         <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Initializing Music Discovery...</p>
        </div>
      )}
    </div>
  );
}
