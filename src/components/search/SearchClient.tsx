
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Music } from "lucide-react";
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Separator } from "@/components/ui/separator";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

interface SearchResult {
  id: string; // Mock Track ID
  title: string;
  artist: string;
  type: "song" | "artist";
  albumArtUrl?: string;
  // uri?: string; // Removed Spotify URI
  // spotifyUrl?: string; // Removed external URL to song on Spotify web
}

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Removed Spotify-related state variables
  // const [spotifyToken, setSpotifyToken] = useState("");
  // const [spotifyTopTracks, setSpotifyTopTracks] = useState<SearchResult[]>([]);
  // const [isFetchingSpotify, setIsFetchingSpotify] = useState(false);
  // const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  // const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);
  // const [createdPlaylistName, setCreatedPlaylistName] = useState<string | null>(null);
  // const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState<string | null>(null);

  // const [selectedTrackForEmbed, setSelectedTrackForEmbed] = useState<SearchResult | null>(null);
  // const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);


  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    // setSpotifyTopTracks([]); // Removed
    // setCreatedPlaylistId(null); // Removed
    // setSelectedTrackForEmbed(null); // Removed
    // setIsEmbedDialogOpen(false); // Removed

    // Simulate API call for mock search
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResults: SearchResult[] = searchTerm.toLowerCase().includes("love") ? [
      { id: "mock1", title: "Love Story (Mock)", artist: "Taylor Swift (Mock)", type: "song", albumArtUrl: `https://placehold.co/300x300.png?text=Love+Story` },
      { id: "mock2", title: "Crazy in Love (Mock)", artist: "Beyoncé (Mock)", type: "song", albumArtUrl: `https://placehold.co/300x300.png?text=Crazy+Love` },
    ] : searchTerm.toLowerCase().includes("rock") ? [
      { id: "mock3", title: "Rock Anthems (Artist Mock)", artist: "Various Artists (Mock)", type: "artist", albumArtUrl: `https://placehold.co/300x300.png?text=Rock+Artist` },
      { id: "mock4", title: "Bohemian Rhapsody (Mock)", artist: "Queen (Mock)", type: "song", albumArtUrl: `https://placehold.co/300x300.png?text=Bohemian` },
    ] : [];

    setResults(mockResults);
    setIsLoading(false);
    if (mockResults.length > 0) {
      toast({ title: "Search Complete", description: `Found ${mockResults.length} mock results.`});
    } else {
      toast({ title: "Search Complete", description: "No mock results found."});
    }
  };

  // Removed Spotify-related handlers:
  // handleFetchSpotifyTopTracks
  // handleCreateSpotifyPlaylist
  // handlePlayInApp

  const currentDisplayResults = results;
  const currentLoadingState = isLoading;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl flex items-center justify-center">
          <SearchIcon className="mr-3 h-8 w-8 text-primary" />
          Find Your Music
        </CardTitle>
        <CardDescription>Search for songs or artists using our mock search.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            type="search"
            placeholder="Search for songs or artists (mock search)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={currentLoadingState}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Search</span>
          </Button>
        </form>

        {/* Removed Spotify token input, buttons, and related UI */}
        {/* <Separator className="my-6" /> */}
        {/* Removed Spotify Connection Section */}

        {/* <Separator className="my-8" /> */}

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
              {searchTerm ? `No mock results for "${searchTerm}". Try "love" or "rock".` : "Try searching for something."}
            </p>
          </div>
        )}

        {!currentLoadingState && currentDisplayResults.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="text-xl font-semibold mb-2">
              {`Search Results for "${searchTerm}"`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentDisplayResults.map((result) => (
              <SongCard
                key={result.id}
                title={result.title}
                artist={result.artist}
                albumArtUrl={result.albumArtUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(result.title.substring(0,10))}`}
                data-ai-hint="music album"
                onPlay={() => toast({title: "Playback (Mock)", description: `Playing ${result.title}`})}
                playButtonText="Play (Mock)"
                // Play icon will default
              />
            ))}
            </div>
          </div>
        )}

        {!currentLoadingState && !hasSearched && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Start by searching</p>
            <p className="text-sm text-muted-foreground">Discover mock songs and artists.</p>
          </div>
        )}

        {/* Removed Spotify Embed Dialog */}
        {/* {selectedTrackForEmbed && (
          <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
            ...
          </Dialog>
        )} */}
      </CardContent>
    </Card>
  );
}
