
"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Youtube, Play, X, Music, Heart } from "lucide-react";
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";
import type { YouTubeMusicSearchResult, YouTubeMusicSearchResponse } from "@/app/actions/youtubeMusicActions";
import { searchYoutubeMusicAction } from "@/app/actions/youtubeMusicActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import YouTubeLyricsDisplay from "./YouTubeLyricsDisplay"; // Added import

type CategoryTab = "DISCOVER" | "INDIA" | "USA" | "SEARCH";

const DEFAULT_DISCOVER_QUERY_TERM = "Top Music Hits";
const INDIA_QUERY_TERM = "Top Indian Music";
const USA_QUERY_TERM = "Top USA Music";

export default function YouTubeMusicSearchPlayer() {
  const [ytSearchTerm, setYtSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryTab>("DISCOVER");
  
  const [currentApiQuery, setCurrentApiQuery] = useState<string>(DEFAULT_DISCOVER_QUERY_TERM);
  const [currentApiRegion, setCurrentApiRegion] = useState<string | undefined>("US"); 

  const [ytResults, setYtResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [resultsTitle, setResultsTitle] = useState<string>("Discover Music");
  
  const [isLoading, setIsLoading] = useState(true); 
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [hasLoadedInitialDiscoverOrSearched, setHasLoadedInitialDiscoverOrSearched] = useState(false);
  
  const [currentPlayingYoutubeTrack, setCurrentPlayingYoutubeTrack] = useState<YouTubeMusicSearchResult | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

  const { toast } = useToast();
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchMusic = useCallback(async (query: string, region?: string, pageToken?: string, isNewQuery: boolean = false) => {
    if (isNewQuery) {
      setIsLoading(true);
      setYtResults([]);
      setNextPageToken(undefined);
      // Keep currentPlayingYoutubeTrack if user is just switching tabs/re-searching same category
      // setCurrentPlayingYoutubeTrack(null); 
      setHasLoadedInitialDiscoverOrSearched(false);
    } else if (pageToken) { 
      setIsLoadMoreLoading(true);
    } else { 
      setIsLoading(true);
      setHasLoadedInitialDiscoverOrSearched(false);
    }
    
    setCurrentApiQuery(query);
    setCurrentApiRegion(region);

    try {
      const response: YouTubeMusicSearchResponse = await searchYoutubeMusicAction(query, pageToken, region);
      
      setYtResults(prevResults => (isNewQuery || !pageToken) ? response.results : [...prevResults, ...response.results]);
      setNextPageToken(response.nextPageToken);

      if (isNewQuery && !pageToken && activeTab === "SEARCH" && query) {
        toast({ title: "YouTube Music Search Complete", description: `Found ${response.results.length} tracks for "${query}".` });
      }
      setHasLoadedInitialDiscoverOrSearched(true);

    } catch (error: any) {
      console.error("YouTube Music fetch error:", error);
      toast({ title: "YouTube Music Fetch Failed", description: error.message || "Could not fetch YouTube Music tracks.", variant: "destructive" });
      setHasLoadedInitialDiscoverOrSearched(true); 
    } finally {
      setIsLoading(false);
      setIsLoadMoreLoading(false);
    }
  }, [toast, activeTab]);
  
  useEffect(() => {
    let query = DEFAULT_DISCOVER_QUERY_TERM;
    let region: string | undefined = "US";
    let title = "Discover Music";

    if (activeTab === "INDIA") {
      query = INDIA_QUERY_TERM;
      region = "IN";
      title = "Top Indian Hits";
    } else if (activeTab === "USA") {
      query = USA_QUERY_TERM;
      region = "US";
      title = "Top USA Hits";
    } else if (activeTab === "SEARCH") {
      if (ytSearchTerm.trim()) {
        query = ytSearchTerm.trim();
        region = undefined; 
        title = `Results for "${ytSearchTerm.trim()}"`;
      } else {
        setYtResults([]); 
        setNextPageToken(undefined);
        setIsLoading(false); 
        setResultsTitle("Search for music");
        setHasLoadedInitialDiscoverOrSearched(true); 
        return; 
      }
    }
    
    setResultsTitle(title);
    fetchMusic(query, region, undefined, true); 
  }, [activeTab, fetchMusic]); // ytSearchTerm removed, handled by search submission

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPageToken && !isLoadMoreLoading && !isLoading) {
        fetchMusic(currentApiQuery, currentApiRegion, nextPageToken);
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [nextPageToken, isLoadMoreLoading, isLoading, currentApiQuery, currentApiRegion, fetchMusic]);

  const handleYoutubeMusicSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchTerm = ytSearchTerm.trim();
    if (!searchTerm) {
      toast({ title: "Empty Search", description: "Please enter a song or artist to search."});
      setResultsTitle("Search for music"); // Reset title for empty search
      setYtResults([]);
      setNextPageToken(undefined);
      setHasLoadedInitialDiscoverOrSearched(true);
      return;
    }
    setResultsTitle(`Results for "${searchTerm}"`);
    fetchMusic(searchTerm, undefined, undefined, true); 
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

  const handleTabChange = (value: string) => {
    setActiveTab(value as CategoryTab);
    if (value !== "SEARCH") {
        setYtSearchTerm(""); 
    }
  };

  const ResultsSection = () => (
    <>
      {resultsTitle && (!isLoading || ytResults.length > 0) && (
        <h3 className="font-headline text-xl mb-4 mt-2">{resultsTitle}</h3>
      )}

      {isLoading && ytResults.length === 0 && (
        <div className="text-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">
            {activeTab === "SEARCH" && currentApiQuery ? `Searching for "${currentApiQuery}"...` : `Loading ${resultsTitle || 'music'}...`}
          </p>
        </div>
      )}

      {!isLoading && ytResults.length === 0 && hasLoadedInitialDiscoverOrSearched && (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">No YouTube Music results</p>
          <p className="text-sm text-muted-foreground">
            {activeTab === "SEARCH" && currentApiQuery ? `No results found for "${currentApiQuery}".` : "Try a different category or search term."}
          </p>
        </div>
      )}

      {ytResults.length > 0 && (
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
      )}
      
      <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-4">
        {isLoadMoreLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {currentPlayingYoutubeTrack && (
        <div className="sticky top-[70px] z-20 space-y-4"> {/* Adjusted top for header height */}
            <Card className="shadow-lg border-primary bg-background/95 backdrop-blur-sm">
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
                    src={`https://www.youtube.com/embed/${currentPlayingYoutubeTrack.videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="rounded-md"
                ></iframe>
                </div>
            </CardContent>
            </Card>
            <YouTubeLyricsDisplay 
                videoId={currentPlayingYoutubeTrack.videoId}
                videoTitle={currentPlayingYoutubeTrack.title}
            />
        </div>
      )}

      <Card className="shadow-md">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 border-b rounded-t-lg bg-card p-0">
            <TabsTrigger value="DISCOVER" className="rounded-tl-lg data-[state=active]:shadow-none data-[state=active]:border-b-transparent">Discover</TabsTrigger>
            <TabsTrigger value="INDIA" className="data-[state=active]:shadow-none data-[state=active]:border-b-transparent">India</TabsTrigger>
            <TabsTrigger value="USA" className="data-[state=active]:shadow-none data-[state=active]:border-b-transparent sm:rounded-none">USA</TabsTrigger>
            <TabsTrigger value="SEARCH" className="rounded-tr-lg data-[state=active]:shadow-none data-[state=active]:border-b-transparent sm:rounded-tr-lg">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="DISCOVER" className="p-4 md:p-6 mt-0">
            <ResultsSection />
          </TabsContent>
          <TabsContent value="INDIA" className="p-4 md:p-6 mt-0">
            <ResultsSection />
          </TabsContent>
          <TabsContent value="USA" className="p-4 md:p-6 mt-0">
            <ResultsSection />
          </TabsContent>
          <TabsContent value="SEARCH" className="p-4 md:p-6 mt-0">
            <form onSubmit={handleYoutubeMusicSearchSubmit} className="flex gap-2 mb-6">
              <Input
                type="search"
                placeholder="Enter song or artist..."
                value={ytSearchTerm}
                onChange={(e) => setYtSearchTerm(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" disabled={isLoading && activeTab === 'SEARCH'} variant="default">
                {isLoading && activeTab === 'SEARCH' ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </form>
            <ResultsSection />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

    