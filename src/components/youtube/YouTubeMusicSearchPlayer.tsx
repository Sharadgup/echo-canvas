
"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import Image from "next/image"; // Added for thumbnail display
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Play, X, Music, Heart, Mic, MicOff, Globe, MapPin, Music2 } from "lucide-react";
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";
import type { YouTubeMusicSearchResult, YouTubeMusicSearchResponse } from "@/app/actions/youtubeMusicActions";
import { searchYoutubeMusicAction } from "@/app/actions/youtubeMusicActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import YouTubeLyricsDisplay from "./YouTubeLyricsDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthContext } from "@/context/AuthContext";
import { toggleLikeSongAction, getLikedSongIdsAction, type LikedSong } from "@/app/actions/likedMusicActions";


type CategoryTab = "DISCOVER" | "INDIA" | "USA" | "GLOBAL_TRENDING" | "TRENDING_BY_COUNTRY" | "SEARCH";

interface Country {
  name: string;
  queryTerm: string;
  code?: string;
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
  const { user } = useAuthContext();
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
  const [likedYouTubeTrackIds, setLikedYouTubeTrackIds] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

  const [selectedTrendingCountry, setSelectedTrendingCountry] = useState<Country | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [speechSupportChecked, setSpeechSupportChecked] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [fallbackResults, setFallbackResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [isFallbackSectionLoading, setIsFallbackSectionLoading] = useState<boolean>(false);
  const [displayFallbackSection, setDisplayFallbackSection] = useState<boolean>(false);


  const { toast } = useToast();
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (user) {
      getLikedSongIdsAction(user.uid, 'youtube').then(ids => {
        setLikedYouTubeTrackIds(new Set(ids));
      });
    }
  }, [user]);


  const loadFallbackResults = useCallback(async () => {
    setIsFallbackSectionLoading(true);
    setDisplayFallbackSection(true);
    try {
        const fallbackResponse = await searchYoutubeMusicAction(DEFAULT_DISCOVER_QUERY_TERM, undefined);
        setFallbackResults(fallbackResponse.results.slice(0, 3));
    } catch (fallbackError) {
        console.error("Error fetching fallback results:", fallbackError);
        setFallbackResults([]);
        toast({ title: "Discovery Failed", description: "Could not load discovery tracks for fallback.", variant: "default" });
    } finally {
        setIsFallbackSectionLoading(false);
    }
  }, [toast]);


  const fetchMusic = useCallback(async (
    queryToFetch: string,
    regionToFetch?: string,
    pageToken?: string,
    isNewQuery: boolean = false
  ) => {

    if (isNewQuery) {
      setIsLoading(true);
      setYtResults([]); 
      setNextPageToken(undefined);
      setHasLoadedInitialDiscoverOrSearched(false); 
    } else if (pageToken) {
      setIsLoadMoreLoading(true);
    } else {
      setIsLoading(true);
      setHasLoadedInitialDiscoverOrSearched(false);
    }

    try {
      const response: YouTubeMusicSearchResponse = await searchYoutubeMusicAction(queryToFetch, pageToken);
      const mainResults = response.results;

      setYtResults(prevResults => (isNewQuery || !pageToken) ? mainResults : [...prevResults, ...mainResults]);
      setNextPageToken(response.nextPageToken);

      if (isNewQuery) {
        if (mainResults.length === 0) {
          if (queryToFetch !== DEFAULT_DISCOVER_QUERY_TERM) {
            loadFallbackResults();
          } else {
            setDisplayFallbackSection(false);
          }
        } else {
          setDisplayFallbackSection(false);
        }
      }

    } catch (error: any) {
      console.error(`YouTube Music fetch error for query "${queryToFetch}":`, error);
      toast({ title: "YouTube Music Fetch Failed", description: error.message || `Could not fetch tracks for "${queryToFetch}".`, variant: "destructive" });
      if (isNewQuery) {
        if (queryToFetch !== DEFAULT_DISCOVER_QUERY_TERM) {
          loadFallbackResults();
        } else {
           setDisplayFallbackSection(false);
        }
      }
    } finally {
      setIsLoading(false);
      setIsLoadMoreLoading(false);
      setHasLoadedInitialDiscoverOrSearched(true);
    }
  }, [toast, loadFallbackResults]);

  useEffect(() => {
    let queryForEffect = "";
    let titleForEffect = "Music Explorer"; 
    let regionForEffect: string | undefined = undefined;
    let doFetch = true;

    if (activeTab !== "TRENDING_BY_COUNTRY" && selectedTrendingCountry) {
        setSelectedTrendingCountry(null); 
    }

    switch (activeTab) {
        case "DISCOVER":
            queryForEffect = DEFAULT_DISCOVER_QUERY_TERM;
            titleForEffect = "Discover Music";
            break;
        case "INDIA":
            queryForEffect = INDIA_QUERY_TERM;
            titleForEffect = "Top Indian Hits";
            break;
        case "USA":
            queryForEffect = USA_QUERY_TERM;
            titleForEffect = "Top USA Hits";
            break;
        case "GLOBAL_TRENDING":
            queryForEffect = GLOBAL_TRENDING_QUERY_TERM;
            titleForEffect = "Global Trending Now";
            break;
        case "TRENDING_BY_COUNTRY":
            titleForEffect = selectedTrendingCountry ? `Trending in ${selectedTrendingCountry.name}` : "Trending by Country - Select a Country";
            if (selectedTrendingCountry) {
                queryForEffect = selectedTrendingCountry.queryTerm;
                regionForEffect = selectedTrendingCountry.code;
            } else {
                 doFetch = false; 
            }
            break;
        case "SEARCH":
            const trimmedSearch = ytSearchTerm.trim();
            titleForEffect = trimmedSearch ? `Results for "${trimmedSearch}"` : "Search for music";
            if (trimmedSearch) {
                queryForEffect = trimmedSearch;
            } else {
                doFetch = false; 
            }
            break;
        default: 
            doFetch = false;
            titleForEffect = "Select a category";
    }

    setResultsTitle(titleForEffect);
    setCurrentApiQuery(queryForEffect || (activeTab === 'DISCOVER' ? DEFAULT_DISCOVER_QUERY_TERM : ""));
    setCurrentApiRegion(regionForEffect);

    if (doFetch && queryForEffect) {
        fetchMusic(queryForEffect, regionForEffect, undefined, true); 
    } else if (!doFetch && (activeTab === "SEARCH" || activeTab === "TRENDING_BY_COUNTRY")) {
        setYtResults([]);
        setNextPageToken(undefined);
        setIsLoading(false);
        setHasLoadedInitialDiscoverOrSearched(true);
        setDisplayFallbackSection(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedTrendingCountry, ytSearchTerm]); 


  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPageToken && !isLoadMoreLoading && !isLoading) {
        if (currentApiQuery) {
           fetchMusic(currentApiQuery, currentApiRegion, nextPageToken, false);
        }
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [nextPageToken, isLoadMoreLoading, isLoading, fetchMusic, currentApiQuery, currentApiRegion]);


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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, activeTab]);


  const handleYoutubeMusicSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchTerm = ytSearchTerm.trim();
    if (!searchTerm) {
      toast({ title: "Empty Search", description: "Please enter a song or artist to search."});
      return;
    }
    if (activeTab !== "SEARCH") {
        setActiveTab("SEARCH"); 
    } else {
      fetchMusic(searchTerm, undefined, undefined, true);
    }
  };


  const handleToggleLikeTrack = async (track: YouTubeMusicSearchResult) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to like songs.", variant: "default" });
      return;
    }
    try {
      const result = await toggleLikeSongAction({
        userId: user.uid,
        songId: track.videoId,
        title: track.title,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
        source: 'youtube',
        youtubeVideoUrl: track.youtubeVideoUrl,
      });

      setLikedYouTubeTrackIds(prevLiked => {
        const newLiked = new Set(prevLiked);
        if (result.liked) {
          newLiked.add(track.videoId);
          toast({ title: "Liked!", description: `${track.title} added to your music.` });
        } else {
          newLiked.delete(track.videoId);
          toast({ title: "Unliked", description: `${track.title} removed from your music.` });
        }
        return newLiked;
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update like status.", variant: "destructive" });
    }
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
  };


  const ResultsSection = () => (
    <>
      {resultsTitle && (
        <h3 className="font-headline text-xl mb-4 mt-2">{resultsTitle}</h3>
      )}

      {isLoading && ytResults.length === 0 && !(activeTab === "TRENDING_BY_COUNTRY" && !selectedTrendingCountry) && (
        <div className="text-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">
            {currentApiQuery ? `Searching for "${currentApiQuery}"...` : `Loading ${resultsTitle || 'music'}...`}
          </p>
        </div>
      )}

      {!isLoading && ytResults.length === 0 && hasLoadedInitialDiscoverOrSearched &&
       !displayFallbackSection &&
       !(activeTab === "TRENDING_BY_COUNTRY" && !selectedTrendingCountry && !isLoading) && (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">No YouTube Music results</p>
          <p className="text-sm text-muted-foreground">
            {currentApiQuery ? `No results found for "${currentApiQuery}". Try a different term or category.` :
             (activeTab === "TRENDING_BY_COUNTRY" && selectedTrendingCountry) ? `No trending results found for ${selectedTrendingCountry.name}.` :
             "Try a different category or search term."}
          </p>
        </div>
      )}

      {ytResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ytResults.map((track) => (
            <SongCard
              key={track.videoId}
              title={track.title}
              artist={track.artist}
              albumArtUrl={track.thumbnailUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(track.title.substring(0,10))}`}
              data-ai-hint="youtube music"
              onPlay={() => setCurrentPlayingYoutubeTrack(track)}
              playButtonText="Play Audio"
              playButtonIcon={Play}
              isActive={currentPlayingYoutubeTrack?.videoId === track.videoId}
              onLike={() => handleToggleLikeTrack(track)}
              isLiked={likedYouTubeTrackIds.has(track.videoId)}
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
                <span className="truncate flex items-center">
                    <Music2 className="mr-2 h-5 w-5 text-primary animate-pulse [animation-duration:1.5s]" />
                    Now Playing: {currentPlayingYoutubeTrack.title}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentPlayingYoutubeTrack(null)} aria-label="Close player">
                    <X className="h-5 w-5" />
                </Button>
                </CardTitle>
                <CardDescription>{currentPlayingYoutubeTrack.artist}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                {currentPlayingYoutubeTrack.thumbnailUrl && (
                    <Image
                        src={currentPlayingYoutubeTrack.thumbnailUrl.replace('mqdefault.jpg', 'hqdefault.jpg')}
                        alt={`Thumbnail for ${currentPlayingYoutubeTrack.title}`}
                        width={320}
                        height={180}
                        className="rounded-md shadow-md mb-4"
                        data-ai-hint="music video thumbnail"
                        priority={true}
                    />
                )}
                <iframe
                    key={currentPlayingYoutubeTrack.videoId}
                    width="0"
                    height="0"
                    style={{ position: 'absolute', top: '-9999px', left: '-9999px', border: 'none' }}
                    src={`https://www.youtube.com/embed/${currentPlayingYoutubeTrack.videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title="YouTube audio player (hidden)"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
                <p className="text-sm text-muted-foreground mt-2">Audio is playing. Close player with 'X' above to stop.</p>
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
              <ScrollArea className="h-auto max-h-[150px] sm:max-h-[200px] w-full">
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
            { (isLoading && selectedTrendingCountry) ||
              (!isLoading && ytResults.length > 0 && selectedTrendingCountry) ||
              (!isLoading && hasLoadedInitialDiscoverOrSearched && selectedTrendingCountry && ytResults.length === 0 && !displayFallbackSection ) ? (
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

      {displayFallbackSection && (
        <div className="mt-8 pt-6 border-t">
            <h3 className="font-headline text-lg mb-4 text-muted-foreground">
                {(ytResults.length === 0 && currentApiQuery && currentApiQuery !== DEFAULT_DISCOVER_QUERY_TERM)
                    ? `No results found for "${currentApiQuery}". `
                    : ""}
                Meanwhile, discover some popular tracks:
            </h3>
            {isFallbackSectionLoading && (
                <div className="text-center py-5">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
            )}
            {!isFallbackSectionLoading && fallbackResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {fallbackResults.map((track) => (
                        <SongCard
                            key={track.videoId + "-fallback"}
                            title={track.title}
                            artist={track.artist}
                            albumArtUrl={track.thumbnailUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(track.title.substring(0,10))}`}
                            data-ai-hint="youtube music fallback"
                            onPlay={() => setCurrentPlayingYoutubeTrack(track)}
                            playButtonText="Play Audio"
                            playButtonIcon={Play}
                            isActive={currentPlayingYoutubeTrack?.videoId === track.videoId}
                            onLike={() => handleToggleLikeTrack(track)}
                            isLiked={likedYouTubeTrackIds.has(track.videoId)}
                            likeButtonIcon={Heart}
                        />
                    ))}
                </div>
            )}
            {!isFallbackSectionLoading && fallbackResults.length === 0 && (
                 <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Could not load discovery tracks at this time.</p>
                </div>
            )}
        </div>
      )}

    </div>
  );
}
