
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Music, Disc3 } from "lucide-react";
import SongCard from "@/components/playlist/SongCard"; 
import { getMyTopTracksAction } from "@/app/actions/spotifyActions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  type: "song" | "artist";
  albumArtUrl?: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: { images: { url: string }[] };
}

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyTopTracks, setSpotifyTopTracks] = useState<SearchResult[]>([]);
  const [isFetchingSpotify, setIsFetchingSpotify] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSpotifyTopTracks([]); // Clear spotify tracks on new general search

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockResults: SearchResult[] = searchTerm.toLowerCase().includes("love") ? [
      { id: "1", title: "Love Story", artist: "Taylor Swift", type: "song" },
      { id: "2", title: "Crazy in Love", artist: "Beyoncé", type: "song" },
      { id: "3", title: "Love Yourself", artist: "Justin Bieber", type: "song" },
    ] : searchTerm.toLowerCase().includes("rock") ? [
      { id: "4", title: "Rock Anthems (Artist)", artist: "Various Artists", type: "artist" },
      { id: "5", title: "Bohemian Rhapsody", artist: "Queen", type: "song" },
    ] : [];
    
    setResults(mockResults);
    setIsLoading(false);
  };

  const handleFetchSpotifyTopTracks = async () => {
    if (!spotifyToken.trim()) {
      toast({
        title: "Spotify Token Required",
        description: "Please paste your Spotify Access Token to fetch top tracks.",
        variant: "destructive",
      });
      return;
    }
    setIsFetchingSpotify(true);
    setResults([]); // Clear general search results
    try {
      const topTracksData = await getMyTopTracksAction(spotifyToken);
      if (topTracksData && topTracksData.error) {
         toast({
          title: "Spotify Error",
          description: topTracksData.error.message || "Could not fetch top tracks.",
          variant: "destructive",
        });
        setSpotifyTopTracks([]);
      } else if (topTracksData && topTracksData.items) {
        const formattedTracks = topTracksData.items.map((track: SpotifyTrack) => ({
          id: track.id,
          title: track.name,
          artist: track.artists.map(artist => artist.name).join(', '),
          type: "song" as "song" | "artist",
          albumArtUrl: track.album?.images?.[0]?.url || `https://placehold.co/300x300.png?text=${encodeURIComponent(track.name.substring(0,10))}`
        }));
        setSpotifyTopTracks(formattedTracks);
        toast({
          title: "Spotify Top Tracks Fetched!",
          description: `Found ${formattedTracks.length} top tracks.`,
        });
      } else {
        setSpotifyTopTracks([]);
         toast({
          title: "No Tracks Found",
          description: "Could not retrieve top tracks from Spotify.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error fetching Spotify top tracks:", error);
      toast({
        title: "Failed to Fetch Spotify Tracks",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setSpotifyTopTracks([]);
    } finally {
      setIsFetchingSpotify(false);
      setHasSearched(true); // Indicate that a search/fetch attempt was made
    }
  };

  const currentDisplayResults = spotifyTopTracks.length > 0 ? spotifyTopTracks : results;
  const currentLoadingState = isFetchingSpotify || isLoading;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl flex items-center justify-center">
          <SearchIcon className="mr-3 h-8 w-8 text-primary" />
          Find Your Music
        </CardTitle>
        <CardDescription>Search for songs, artists, or fetch your Spotify top tracks.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            type="search"
            placeholder="Search for songs or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading || isFetchingSpotify}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Search</span>
          </Button>
        </form>

        <Separator className="my-6" />
        
        <div>
          <h3 className="text-lg font-semibold mb-2 text-center">Your Spotify</h3>
           <Alert variant="default" className="mb-4 bg-accent/10 border-accent/30">
            <Disc3 className="h-4 w-4 !text-accent" />
            <AlertTitle className="text-accent">Spotify Integration (Developer Preview)</AlertTitle>
            <AlertDescription className="text-accent/80">
              To fetch your top tracks, you need a temporary Spotify Access Token. 
              You can get one from <a href="https://developer.spotify.com/console/get-current-user-top-artists-and-tracks/?type=tracks&time_range=long_term&limit=10" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Spotify's Console</a> (click "Get Token", select `user-top-read`).
              This token is short-lived. <strong className="text-destructive-foreground bg-destructive px-1 rounded">Do not use this method in production.</strong>
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              type="password" // Use password to obscure slightly, but still not secure for storage
              placeholder="Paste your Spotify Access Token here"
              value={spotifyToken}
              onChange={(e) => setSpotifyToken(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleFetchSpotifyTopTracks} disabled={isFetchingSpotify || isLoading} className="w-full sm:w-auto">
              {isFetchingSpotify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
              <span className="ml-2">Fetch My Top Tracks</span>
            </Button>
          </div>
        </div>

        <Separator className="my-8" />


        {currentLoadingState && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Searching...</p>
          </div>
        )}

        {!currentLoadingState && hasSearched && currentDisplayResults.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground">
              {spotifyTopTracks.length > 0 ? "Could not load your Spotify top tracks." : `No results for "${searchTerm}". Try a different search term or check your spelling.`}
            </p>
          </div>
        )}

        {!currentLoadingState && currentDisplayResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-2">
              {spotifyTopTracks.length > 0 ? "Your Spotify Top Tracks" : `Search Results for "${searchTerm}"`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentDisplayResults.map((result) => (
              <SongCard 
                key={result.id} 
                title={result.title} 
                artist={result.artist}
                albumArtUrl={result.albumArtUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(result.title.substring(0,10))}`}
                data-ai-hint="music album"
              />
            ))}
            </div>
          </div>
        )}
         {!currentLoadingState && !hasSearched && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Start by typing your query or fetch Spotify tracks</p>
            <p className="text-sm text-muted-foreground">Discover songs, artists, and more.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    