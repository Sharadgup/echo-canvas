
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Music, Disc3, ListPlus, ExternalLink, Play } from "lucide-react";
import SongCard from "@/components/playlist/SongCard";
import { getMyTopTracksAction, createPlaylistWithTracksAction } from "@/app/actions/spotifyActions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // Not used directly here for programmatic open
  // DialogClose, // Not needed as DialogContent has X
} from "@/components/ui/dialog";

interface SearchResult {
  id: string; // Spotify Track ID
  title: string;
  artist: string;
  type: "song" | "artist";
  albumArtUrl?: string;
  uri?: string; // Full Spotify track URI
  spotifyUrl?: string; // External URL to song on Spotify web
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: { images: { url: string }[] };
  uri: string;
  external_urls?: { spotify: string; };
}

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyTopTracks, setSpotifyTopTracks] = useState<SearchResult[]>([]);
  const [isFetchingSpotify, setIsFetchingSpotify] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);
  const [createdPlaylistName, setCreatedPlaylistName] = useState<string | null>(null);
  const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState<string | null>(null);

  const [selectedTrackForEmbed, setSelectedTrackForEmbed] = useState<SearchResult | null>(null);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);


  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSpotifyTopTracks([]);
    setCreatedPlaylistId(null);
    setSelectedTrackForEmbed(null);
    setIsEmbedDialogOpen(false);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResults: SearchResult[] = searchTerm.toLowerCase().includes("love") ? [
      { id: "1", title: "Love Story", artist: "Taylor Swift", type: "song", uri: "spotify:track:1", spotifyUrl: "#" },
      { id: "2", title: "Crazy in Love", artist: "Beyoncé", type: "song", uri: "spotify:track:2", spotifyUrl: "#" },
      { id: "3", title: "Love Yourself", artist: "Justin Bieber", type: "song", uri: "spotify:track:3", spotifyUrl: "#" },
    ] : searchTerm.toLowerCase().includes("rock") ? [
      { id: "4", title: "Rock Anthems (Artist)", artist: "Various Artists", type: "artist", uri: "spotify:artist:1", spotifyUrl: "#" },
      { id: "5", title: "Bohemian Rhapsody", artist: "Queen", type: "song", uri: "spotify:track:5", spotifyUrl: "#" },
    ] : [];

    setResults(mockResults);
    setIsLoading(false);
  };

  const handleFetchSpotifyTopTracks = async () => {
    if (!spotifyToken.trim()) {
      toast({
        title: "Spotify Token Required",
        description: "Please paste your Spotify Access Token.",
        variant: "destructive",
      });
      return;
    }
    setIsFetchingSpotify(true);
    setResults([]);
    setCreatedPlaylistId(null);
    setSelectedTrackForEmbed(null);
    setIsEmbedDialogOpen(false);
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
        const formattedTracks = topTracksData.items.map((track: SpotifyTrackItem) => ({
          id: track.id,
          title: track.name,
          artist: track.artists.map(artist => artist.name).join(', '),
          type: "song" as "song" | "artist",
          albumArtUrl: track.album?.images?.[0]?.url || `https://placehold.co/300x300.png?text=${encodeURIComponent(track.name.substring(0,10))}`,
          uri: track.uri,
          spotifyUrl: track.external_urls?.spotify,
        }));
        setSpotifyTopTracks(formattedTracks);
        toast({
          title: "Spotify Top Tracks Fetched!",
          description: `Found ${formattedTracks.length} top tracks. Ready to create a playlist!`,
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
      setHasSearched(true);
    }
  };

  const handleCreateSpotifyPlaylist = async () => {
    if (!spotifyToken.trim() || spotifyTopTracks.length === 0) {
      toast({
        title: "Cannot Create Playlist",
        description: "Ensure you have a Spotify token and have fetched your top tracks first.",
        variant: "destructive",
      });
      return;
    }
    setIsCreatingPlaylist(true);
    setCreatedPlaylistId(null);
    setSelectedTrackForEmbed(null);
    setIsEmbedDialogOpen(false);
    try {
      const trackUris = spotifyTopTracks.map(track => track.uri).filter(uri => !!uri) as string[];
      if (trackUris.length === 0) {
        toast({ title: "No Track URIs", description: "No valid Spotify track URIs found in top tracks.", variant: "destructive" });
        setIsCreatingPlaylist(false);
        return;
      }

      const playlistData = await createPlaylistWithTracksAction(spotifyToken, trackUris);

      if (playlistData && playlistData.error) {
        toast({
          title: "Spotify Playlist Error",
          description: playlistData.error.message || "Could not create playlist.",
          variant: "destructive",
        });
      } else if (playlistData && playlistData.id) {
        setCreatedPlaylistId(playlistData.id);
        setCreatedPlaylistName(playlistData.name);
        setCreatedPlaylistUrl(playlistData.external_urls?.spotify);
        toast({
          title: "Playlist Created!",
          description: `Successfully created playlist: "${playlistData.name}". It's now embedded below.`,
        });
      }
    } catch (error: any) {
      console.error("Error creating Spotify playlist:", error);
      toast({
        title: "Failed to Create Playlist",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handlePlayInApp = (track: SearchResult) => {
    if (track.type === "song" && track.id) {
        setSelectedTrackForEmbed(track);
        setIsEmbedDialogOpen(true);
    } else {
        toast({ title: "Cannot Play", description: "This item is not a playable song or is missing an ID.", variant: "default"});
    }
  };

  const currentDisplayResults = spotifyTopTracks.length > 0 ? spotifyTopTracks : results;
  const currentLoadingState = isFetchingSpotify || isLoading || isCreatingPlaylist;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl flex items-center justify-center">
          <SearchIcon className="mr-3 h-8 w-8 text-primary" />
          Find Your Music
        </CardTitle>
        <CardDescription>Search for songs, artists, or manage your Spotify top tracks.</CardDescription>
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

        <Separator className="my-6" />

        <div>
          <h3 className="text-xl font-semibold mb-4 text-center text-primary">Connect to Spotify & Manage Tracks</h3>
           <Alert variant="default" className="mb-4 bg-accent/10 border-accent/30">
            <Disc3 className="h-4 w-4 !text-accent" />
            <AlertTitle className="text-accent">Spotify Integration (Developer Preview)</AlertTitle>
            <AlertDescription className="text-accent/80">
              To use Spotify features, get a temporary Access Token from <a href="https://developer.spotify.com/console/get-current-user-top-artists-and-tracks/?type=tracks&time_range=long_term&limit=10" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Spotify's Console</a>.
              Click "Get Token" and select scopes: `user-top-read`, `user-read-private`, `playlist-modify-public`, `playlist-modify-private`.
              This token is short-lived. <strong className="text-destructive-foreground bg-destructive px-1 rounded">Do not use this method in production.</strong>
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              type="password"
              placeholder="Paste your Spotify Access Token here"
              value={spotifyToken}
              onChange={(e) => setSpotifyToken(e.target.value)}
              className="flex-grow"
              disabled={currentLoadingState}
            />
            <Button onClick={handleFetchSpotifyTopTracks} disabled={currentLoadingState || !spotifyToken} className="w-full sm:w-auto">
              {isFetchingSpotify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
              <span className="ml-2">Fetch Top Tracks</span>
            </Button>
          </div>
          {spotifyTopTracks.length > 0 && (
            <Button
                onClick={handleCreateSpotifyPlaylist}
                disabled={currentLoadingState || !spotifyToken || spotifyTopTracks.length === 0}
                className="w-full mt-2"
                variant="secondary"
            >
                {isCreatingPlaylist ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
                <span className="ml-2">Create Playlist on Spotify from Top Tracks</span>
            </Button>
          )}
        </div>

        <Separator className="my-8" />

        {currentLoadingState && !createdPlaylistId && !isEmbedDialogOpen && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Processing your request...</p>
          </div>
        )}

        {!currentLoadingState && hasSearched && currentDisplayResults.length === 0 && !createdPlaylistId && !isEmbedDialogOpen && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? `No mock results for "${searchTerm}".` : "Fetch your Spotify tracks or try a general search."}
            </p>
          </div>
        )}

        {!currentLoadingState && currentDisplayResults.length > 0 && !createdPlaylistId && !isEmbedDialogOpen && (
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
                onPlay={() => handlePlayInApp(result)}
                playButtonText="Play in App"
                playButtonIcon={Play}
              />
            ))}
            </div>
          </div>
        )}

        {createdPlaylistId && !isEmbedDialogOpen && (
          <div className="mt-8 space-y-4">
            <h3 className="text-2xl font-bold text-center text-primary">Playlist Created: {createdPlaylistName}</h3>
            {createdPlaylistUrl && (
                 <Button variant="link" asChild className="mx-auto block">
                    <a href={createdPlaylistUrl} target="_blank" rel="noopener noreferrer">
                        Open Playlist on Spotify <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            )}
            <div className="aspect-video border rounded-lg overflow-hidden shadow-lg">
              <iframe
                title={`Spotify Embed: ${createdPlaylistName || 'Echo Canvas Playlist'}`}
                src={`https://open.spotify.com/embed/playlist/${createdPlaylistId}?utm_source=generator&theme=0`}
                width="100%"
                height="100%"
                style={{ minHeight: '360px', border: 'none' }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>
        )}

         {!currentLoadingState && !hasSearched && !createdPlaylistId && !isEmbedDialogOpen && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Start by searching or connecting to Spotify</p>
            <p className="text-sm text-muted-foreground">Discover songs, artists, and manage your playlists.</p>
          </div>
        )}

        {selectedTrackForEmbed && (
          <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl w-full p-0">
              <DialogHeader className="p-4 border-b">
                <DialogTitle>Playing: {selectedTrackForEmbed.title}</DialogTitle>
                <DialogDescription>{selectedTrackForEmbed.artist}</DialogDescription>
              </DialogHeader>
              <div className="h-[352px]"> {/* Standard height for full Spotify track embed */}
                 <iframe
                    title={`Spotify Embed: ${selectedTrackForEmbed.title}`}
                    src={`https://open.spotify.com/embed/track/${selectedTrackForEmbed.id}?utm_source=generator&theme=0`}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

