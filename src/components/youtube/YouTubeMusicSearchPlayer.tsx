
"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Youtube, Play, X, Music, Heart, Mic, MicOff, Globe, MapPin } from "lucide-react";
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";
import type { YouTubeMusicSearchResult, YouTubeMusicSearchResponse } from "@/app/actions/youtubeMusicActions";
import { searchYoutubeMusicAction } from "@/app/actions/youtubeMusicActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import YouTubeLyricsDisplay from "./YouTubeLyricsDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";


type CategoryTab = "DISCOVER" | "INDIA" | "USA" | "GLOBAL_TRENDING" | "TRENDING_BY_COUNTRY" | "SEARCH";

interface Country {
  name: string;
  queryTerm: string;
  code?: string; // Optional: YouTube regionCode if we want to use it
}

const DEFAULT_DISCOVER_QUERY_TERM = "Top Music Hits";
const INDIA_QUERY_TERM = "Top Indian Music";
const USA_QUERY_TERM = "Top USA Music";
const GLOBAL_TRENDING_QUERY_TERM = "Global Top Music Hits Now";

const trendingCountries: Country[] = [
  { name: "United Kingdom", queryTerm: "Trending music UK", code: "GB" },
  { name: "Canada", queryTerm: "Trending music Canada", code: "CA" },
  { name: "Australia", queryTerm: "Trending music Australia", code: "AU" },
  { name: "Germany", queryTerm: "Trending music Germany", code: "DE" },
  { name: "Brazil", queryTerm: "Trending music Brazil", code: "BR" },
  { name: "Japan", queryTerm: "Trending music Japan", code: "JP" },
  { name: "South Korea", queryTerm: "Trending music South Korea", code: "KR" },
  { name: "France", queryTerm: "Trending music France", code: "FR" },
  { name: "Mexico", queryTerm: "Trending music Mexico", code: "MX" },
  { name: "Nigeria", queryTerm: "Trending music Nigeria", code: "NG" },
];

export default function YouTubeMusicSearchPlayer() {
  const [ytSearchTerm, setYtSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryTab>("DISCOVER");
  
  const [currentApiQuery, setCurrentApiQuery] = useState<string>(DEFAULT_DISCOVER_QUERY_TERM);
  const [currentApiRegion, setCurrentApiRegion] = useState<string | undefined>(undefined); 

  const [ytResults, setYtResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [resultsTitle, setResultsTitle] = useState<string>("Discover Music");
  
  const [isLoading, setIsLoading] = useState(true); 
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [hasLoadedInitialDiscoverOrSearched, setHasLoadedInitialDiscoverOrSearched] = useState(false);
  
  const [currentPlayingYoutubeTrack, setCurrentPlayingYoutubeTrack] = useState<YouTubeMusicSearchResult | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

  const [selectedTrendingCountry, setSelectedTrendingCountry] = useState<Country | null>(null);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [speechSupportChecked, setSpeechSupportChecked] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);


  const { toast } = useToast();
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchMusic = useCallback(async (query: string, region?: string, pageToken?: string, isNewQuery: boolean = false) => {
    if (!query && (activeTab === "SEARCH" || activeTab === "TRENDING_BY_COUNTRY" && !selectedTrendingCountry) ) {
        setYtResults([]);
        setNextPageToken(undefined);
        setIsLoading(false);
        setHasLoadedInitialDiscoverOrSearched(true);
        if (activeTab === "SEARCH") setResultsTitle("Search for music");
        if (activeTab === "TRENDING_BY_COUNTRY" && !selectedTrendingCountry) setResultsTitle("Trending by Country - Select a Country");
        return;
    }

    if (isNewQuery) {
      setIsLoading(true);
      setYtResults([]); // Clear previous results for a new query
      setNextPageToken(undefined);
      setHasLoadedInitialDiscoverOrSearched(false);
    } else if (pageToken) { 
      setIsLoadMoreLoading(true);
    } else { 
      // This case might be redundant if isNewQuery handles initial loads
      setIsLoading(true);
      setHasLoadedInitialDiscoverOrSearched(false);
    }
    
    setCurrentApiQuery(query); // Keep track of the current base query
    setCurrentApiRegion(region); // Keep track of the current region

    try {
      const response: YouTubeMusicSearchResponse = await searchYoutubeMusicAction(query, pageToken);
      
      setYtResults(prevResults => (isNewQuery || !pageToken) ? response.results : [...prevResults, ...response.results]);
      setNextPageToken(response.nextPageToken);
      setHasLoadedInitialDiscoverOrSearched(true);

    } catch (error: any) {
      console.error("YouTube Music fetch error:", error);
      toast({ title: "YouTube Music Fetch Failed", description: error.message || "Could not fetch YouTube Music tracks.", variant: "destructive" });
      setHasLoadedInitialDiscoverOrSearched(true); 
    } finally {
      setIsLoading(false);
      setIsLoadMoreLoading(false);
    }
  }, [toast, activeTab, selectedTrendingCountry]);
  
  // Effect for handling tab changes and initial load for category tabs
  useEffect(() => {
    let query = "";
    let title = "Music Explorer";
    let region: string | undefined = undefined;
    let doFetchInitial = true;

    if (activeTab !== "TRENDING_BY_COUNTRY") {
        setSelectedTrendingCountry(null); // Clear selected country when leaving the tab
    }
    if (activeTab === "SEARCH" && ytSearchTerm.trim() === "") { // Don't auto-fetch for empty search
        doFetchInitial = false;
    }


    switch (activeTab) {
        case "DISCOVER":
            query = DEFAULT_DISCOVER_QUERY_TERM;
            title = "Discover Music";
            break;
        case "INDIA":
            query = INDIA_QUERY_TERM;
            title = "Top Indian Hits";
            // region = "IN";
            break;
        case "USA":
            query = USA_QUERY_TERM;
            title = "Top USA Hits";
            // region = "US";
            break;
        case "GLOBAL_TRENDING":
            query = GLOBAL_TRENDING_QUERY_TERM;
            title = "Global Trending Now";
            break;
        case "TRENDING_BY_COUNTRY":
            // Fetching is deferred to country selection or selectedTrendingCountry effect
            title = selectedTrendingCountry ? `Trending in ${selectedTrendingCountry.name}` : "Trending by Country - Select a Country";
            if (!selectedTrendingCountry) { // If no country selected, clear results, don't fetch
                setYtResults([]);
                setNextPageToken(undefined);
                setIsLoading(false);
                setHasLoadedInitialDiscoverOrSearched(true);
            }
            doFetchInitial = !!selectedTrendingCountry; // Fetch only if a country is already selected (e.g. on tab switch back)
            if(selectedTrendingCountry) query = selectedTrendingCountry.queryTerm;
            break;
        case "SEARCH":
             // Fetching is deferred to ytSearchTerm effect
            title = ytSearchTerm.trim() ? `Results for "${ytSearchTerm.trim()}"` : "Search for music";
             if (!ytSearchTerm.trim()) {
                setYtResults([]);
                setNextPageToken(undefined);
                setIsLoading(false);
                setHasLoadedInitialDiscoverOrSearched(true);
            }
            doFetchInitial = false;
            break;
        default:
            doFetchInitial = false;
    }
    
    setResultsTitle(title);
    if (doFetchInitial && query) {
        fetchMusic(query, region, undefined, true);
    }
  }, [activeTab, fetchMusic]); // Removed selectedTrendingCountry & ytSearchTerm dependency here, they have their own effects


  // Effect for search term changes specifically for the SEARCH tab
  useEffect(() => {
    if (activeTab === "SEARCH") {
      const searchTerm = ytSearchTerm.trim();
      if (searchTerm) {
        const handler = setTimeout(() => {
          setResultsTitle(`Results for "${searchTerm}"`);
          fetchMusic(searchTerm, undefined, undefined, true);
        }, 500); // Debounce search
        return () => clearTimeout(handler);
      } else { // Handle clearing search term
        setResultsTitle("Search for music");
        setYtResults([]);
        setNextPageToken(undefined);
        setIsLoading(false); // Ensure loading is false
        setHasLoadedInitialDiscoverOrSearched(true); // Treat as "searched" but empty
      }
    }
  }, [ytSearchTerm, activeTab, fetchMusic]);

  // Effect for selected trending country
  useEffect(() => {
    if (activeTab === "TRENDING_BY_COUNTRY" && selectedTrendingCountry) {
      setResultsTitle(`Trending in ${selectedTrendingCountry.name}`);
      fetchMusic(selectedTrendingCountry.queryTerm, selectedTrendingCountry.code, undefined, true);
    }
  }, [selectedTrendingCountry, activeTab, fetchMusic]);


  // Effect for infinite scrolling
  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPageToken && !isLoadMoreLoading && !isLoading) {
        // Determine current query based on active tab and selections
        let queryForLoadMore = currentApiQuery;
        let regionForLoadMore = currentApiRegion;

        if (activeTab === "TRENDING_BY_COUNTRY" && selectedTrendingCountry) {
            queryForLoadMore = selectedTrendingCountry.queryTerm;
            regionForLoadMore = selectedTrendingCountry.code;
        } else if (activeTab === "SEARCH" && ytSearchTerm.trim()) {
            queryForLoadMore = ytSearchTerm.trim();
            regionForLoadMore = undefined;
        }
        // For other category tabs, currentApiQuery and currentApiRegion should be set correctly by their respective effects.

        if (queryForLoadMore) {
           fetchMusic(queryForLoadMore, regionForLoadMore, nextPageToken);
        }
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [nextPageToken, isLoadMoreLoading, isLoading, fetchMusic, activeTab, selectedTrendingCountry, ytSearchTerm, currentApiQuery, currentApiRegion]);


  // Effect for Speech Recognition Initialization
  useEffect(() => {
    if (typeof window === 'undefined') {
        setSpeechSupportChecked(true);
        return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSpeechRecognitionSupported(true);
      const newRecognition = new SpeechRecognitionAPI();
      newRecognition.continuous = false;
      newRecognition.interimResults = false;
      newRecognition.lang = 'en-US';

      newRecognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.trim();
        setYtSearchTerm(transcript); 

        if (transcript) {
          if (activeTab !== "SEARCH") {
            setActiveTab("SEARCH"); 
          }
        }
        setIsListening(false);
      };

      newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMsg = 'Speech recognition error.';
        if (event.error === 'no-speech') {
          errorMsg = 'No speech was detected. Please try again.';
        } else if (event.error === 'audio-capture') {
          errorMsg = 'Microphone problem. Please ensure it is connected and enabled.';
        } else if (event.error === 'not-allowed') {
          errorMsg = 'Microphone access denied. Please allow microphone access in your browser settings.';
        }
        setSpeechRecognitionError(errorMsg);
        toast({ title: "Speech Recognition Error", description: errorMsg, variant: "destructive" });
        setIsListening(false);
      };

      newRecognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = newRecognition;
    } else {
      setIsSpeechRecognitionSupported(false);
    }
    setSpeechSupportChecked(true);

    return () => {
      recognitionRef.current?.abort();
    };
  }, [toast, setYtSearchTerm, activeTab, setActiveTab]); 


  const handleYoutubeMusicSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchTerm = ytSearchTerm.trim();
    if (!searchTerm) {
      toast({ title: "Empty Search", description: "Please enter a song or artist to search."});
      setResultsTitle("Search for music"); 
      setYtResults([]);
      setNextPageToken(undefined);
      setHasLoadedInitialDiscoverOrSearched(true);
      return;
    }
    // If not already on search tab, switch to it. The useEffect for activeTab will handle title.
    if (activeTab !== "SEARCH") {
        setActiveTab("SEARCH");
    } else {
      // If already on search tab, trigger fetch directly as activeTab won't change
      setResultsTitle(`Results for "${searchTerm}"`);
      fetchMusic(searchTerm, undefined, undefined, true); 
    }
    toast({ title: "YouTube Music Search Initiated", description: `Searching for "${searchTerm}".` });
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
  };

  const handleToggleListening = () => {
    if (!isSpeechRecognitionSupported || !recognitionRef.current) {
      toast({ title: "Unsupported", description: "Speech recognition is not supported in your browser.", variant: "default" });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechRecognitionError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ title: "Error", description: "Could not start speech recognition. Try again.", variant: "destructive" });
        setIsListening(false);
      }
    }
  };

  const handleSelectTrendingCountry = (country: Country) => {
    setSelectedTrendingCountry(country);
    // Fetching is handled by the useEffect watching selectedTrendingCountry & activeTab
  };


  const ResultsSection = () => (
    <>
      {resultsTitle && (!isLoading || ytResults.length > 0 || (activeTab === "TRENDING_BY_COUNTRY" && !selectedTrendingCountry)) && (
         <h3 className="font-headline text-xl mb-4 mt-2">{resultsTitle}</h3>
      )}

      {isLoading && ytResults.length === 0 && !(activeTab === "TRENDING_BY_COUNTRY" && !selectedTrendingCountry) && (
        <div className="text-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">
            {activeTab === "SEARCH" && currentApiQuery ? `Searching for "${currentApiQuery}"...` : `Loading ${resultsTitle || 'music'}...`}
          </p>
        </div>
      )}

      {!isLoading && ytResults.length === 0 && hasLoadedInitialDiscoverOrSearched && 
       !(activeTab === "TRENDING_BY_COUNTRY" && !selectedTrendingCountry && !isLoading) && ( // Don't show "No results" if waiting for country selection
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">No YouTube Music results</p>
          <p className="text-sm text-muted-foreground">
            {activeTab === "SEARCH" && currentApiQuery ? `No results found for "${currentApiQuery}". Try a different term.` : 
             activeTab === "TRENDING_BY_COUNTRY" && selectedTrendingCountry ? `No trending results found for ${selectedTrendingCountry.name}.` :
             "Try a different category or search term."}
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
              data-ai-hint="youtube music"
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
        <div className="sticky top-[70px] z-20 space-y-4"> 
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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 border-b rounded-t-lg bg-card p-0">
            <TabsTrigger value="DISCOVER" className="rounded-tl-lg data-[state=active]:shadow-none data-[state=active]:border-b-transparent"><Globe className="mr-1 h-4 w-4 sm:hidden md:inline-block" />Discover</TabsTrigger>
            <TabsTrigger value="INDIA" className="data-[state=active]:shadow-none data-[state=active]:border-b-transparent"><MapPin className="mr-1 h-4 w-4 sm:hidden md:inline-block" />India</TabsTrigger>
            <TabsTrigger value="USA" className="data-[state=active]:shadow-none data-[state=active]:border-b-transparent"><MapPin className="mr-1 h-4 w-4 sm:hidden md:inline-block" />USA</TabsTrigger>
            <TabsTrigger value="GLOBAL_TRENDING" className="data-[state=active]:shadow-none data-[state=active]:border-b-transparent"><Globe className="mr-1 h-4 w-4 sm:hidden md:inline-block" />Global</TabsTrigger>
            <TabsTrigger value="TRENDING_BY_COUNTRY" className="data-[state=active]:shadow-none data-[state=active]:border-b-transparent"><MapPin className="mr-1 h-4 w-4 sm:hidden md:inline-block" />By Country</TabsTrigger>
            <TabsTrigger value="SEARCH" className="rounded-tr-lg data-[state=active]:shadow-none data-[state=active]:border-b-transparent sm:rounded-tr-lg"><SearchIcon className="mr-1 h-4 w-4 sm:hidden md:inline-block" />Search</TabsTrigger>
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
          <TabsContent value="GLOBAL_TRENDING" className="p-4 md:p-6 mt-0">
            <ResultsSection />
          </TabsContent>
          <TabsContent value="TRENDING_BY_COUNTRY" className="p-4 md:p-6 mt-0 space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-3">Select a Country:</h4>
              <ScrollArea className="h-auto max-h-[150px] sm:max-h-[200px] w-full"> {/* Added ScrollArea for many countries */}
                <div className="flex flex-wrap gap-2">
                  {trendingCountries.map((country) => (
                    <Button
                      key={country.name}
                      variant={selectedTrendingCountry?.name === country.name ? "default" : "outline"}
                      onClick={() => handleSelectTrendingCountry(country)}
                      size="sm"
                      className="shadow-sm"
                    >
                      {country.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            { (isLoading && selectedTrendingCountry) || (!isLoading && ytResults.length > 0 && selectedTrendingCountry) || (!isLoading && hasLoadedInitialDiscoverOrSearched && selectedTrendingCountry && ytResults.length === 0 ) ? (
                <ResultsSection />
            ) : !isLoading && !selectedTrendingCountry ? (
                <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-semibold text-muted-foreground">Select a country above</p>
                    <p className="text-sm text-muted-foreground">To explore its trending music.</p>
                </div>
            ) : null }
          </TabsContent>
          <TabsContent value="SEARCH" className="p-4 md:p-6 mt-0">
            <form onSubmit={handleYoutubeMusicSearchSubmit} className="flex gap-2 mb-6 items-center">
              <Input
                type="search"
                placeholder="Enter song or artist, or use mic..."
                value={ytSearchTerm}
                onChange={(e) => setYtSearchTerm(e.target.value)}
                className="flex-grow"
                aria-label="Search YouTube Music"
              />
              {isSpeechRecognitionSupported && (
                <Button
                  type="button"
                  onClick={handleToggleListening}
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  aria-label={isListening ? "Stop listening" : "Start voice search"}
                  title={isListening ? "Stop listening" : "Start voice search"}
                  disabled={!isSpeechRecognitionSupported} 
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
              <Button type="submit" disabled={isLoading && activeTab === 'SEARCH'} variant="default">
                {isLoading && activeTab === 'SEARCH' ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </form>
            {speechSupportChecked && !isSpeechRecognitionSupported && (
              <Alert variant="default" className="mt-2 mb-4">
                 <Mic className="h-4 w-4" />
                <AlertTitle>Voice Search Not Available</AlertTitle>
                <AlertDescription>
                  Speech recognition is not supported by your browser. For voice search, please try using Chrome or Edge.
                </AlertDescription>
              </Alert>
            )}
            {speechRecognitionError && (
              <Alert variant="destructive" className="mt-2 mb-4">
                 <MicOff className="h-4 w-4" />
                <AlertTitle>Voice Search Error</AlertTitle>
                <AlertDescription>{speechRecognitionError}</AlertDescription>
              </Alert>
            )}
            <ResultsSection />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

