
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Music, Youtube, ExternalLink } from "lucide-react"; // Added Youtube
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Local mock search result type
interface MockSearchResult {
  id: string; 
  title: string;
  artist: string;
  type: "song" | "artist";
  albumArtUrl?: string;
}

// YouTube Music Search Result Type
import type { YouTubeMusicSearchResult } from "@/app/actions/youtubeMusicActions";
import { searchYoutubeMusicAction } from "@/app/actions/youtubeMusicActions";


export default function SearchClient() {
  const [mockSearchTerm, setMockSearchTerm] = useState("");
  const [mockResults, setMockResults] = useState<MockSearchResult[]>([]);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const [hasMockSearched, setHasMockSearched] = useState(false);

  const [ytSearchTerm, setYtSearchTerm] = useState("");
  const [ytResults, setYtResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [isYtLoading, setIsYtLoading] = useState(false);
  const [hasYtSearched, setHasYtSearched] = useState(false);

  const { toast } = useToast();

  const handleMockSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockSearchTerm.trim()) return;

    setIsMockLoading(true);
    setHasMockSearched(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newMockResults: MockSearchResult[] = mockSearchTerm.toLowerCase().includes("love") ? [
      { id: "mock1", title: "Love Story (Mock)", artist: "Taylor Swift (Mock)", type: "song", albumArtUrl: `https://placehold.co/300x300.png?text=Love+Story` },
      { id: "mock2", title: "Crazy in Love (Mock)", artist: "Beyoncé (Mock)", type: "song", albumArtUrl: `https://placehold.co/300x300.png?text=Crazy+Love` },
    ] : mockSearchTerm.toLowerCase().includes("rock") ? [
      { id: "mock3", title: "Rock Anthems (Artist Mock)", artist: "Various Artists (Mock)", type: "artist", albumArtUrl: `https://placehold.co/300x300.png?text=Rock+Artist` },
      { id: "mock4", title: "Bohemian Rhapsody (Mock)", artist: "Queen (Mock)", type: "song", albumArtUrl: `https://placehold.co/300x300.png?text=Bohemian` },
    ] : [];

    setMockResults(newMockResults);
    setIsMockLoading(false);
    if (newMockResults.length > 0) {
      toast({ title: "Mock Search Complete", description: `Found ${newMockResults.length} mock results.`});
    } else {
      toast({ title: "Mock Search Complete", description: "No mock results found."});
    }
  };

  const handleYoutubeMusicSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytSearchTerm.trim()) return;

    setIsYtLoading(true);
    setHasYtSearched(true);
    setYtResults([]);

    try {
      const results = await searchYoutubeMusicAction(ytSearchTerm);
      setYtResults(results);
      if (results.length > 0) {
        toast({ title: "YouTube Music Search Complete", description: `Found ${results.length} tracks.` });
      } else {
        toast({ title: "YouTube Music Search Complete", description: "No tracks found or API not fully configured." });
      }
    } catch (error: any) {
      console.error("YouTube Music search error:", error);
      toast({ title: "YouTube Music Search Failed", description: error.message || "Could not fetch YouTube Music tracks.", variant: "destructive" });
    } finally {
      setIsYtLoading(false);
    }
  };


  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl flex items-center justify-center">
            <SearchIcon className="mr-3 h-8 w-8 text-primary" />
            Find Your Music
          </CardTitle>
          <CardDescription>Search for songs or artists using our mock search or YouTube Music.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mock Search Section */}
          <h3 className="text-xl font-semibold mb-2 mt-4">Mock Search</h3>
          <form onSubmit={handleMockSearch} className="flex gap-2 mb-6">
            <Input
              type="search"
              placeholder="Search mock songs (e.g., love, rock)..."
              value={mockSearchTerm}
              onChange={(e) => setMockSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isMockLoading}>
              {isMockLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Search Mock</span>
            </Button>
          </form>

          {isMockLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Searching mock library...</p>
            </div>
          )}

          {!isMockLoading && hasMockSearched && mockResults.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No mock results found</p>
              <p className="text-sm text-muted-foreground">
                {mockSearchTerm ? `No mock results for "${mockSearchTerm}". Try "love" or "rock".` : "Try searching for something."}
              </p>
            </div>
          )}

          {!isMockLoading && mockResults.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold mb-2">
                {`Mock Search Results for "${mockSearchTerm}"`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockResults.map((result) => (
                <SongCard
                  key={result.id}
                  title={result.title}
                  artist={result.artist}
                  albumArtUrl={result.albumArtUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(result.title.substring(0,10))}`}
                  data-ai-hint="music album"
                  onPlay={() => toast({title: "Playback (Mock)", description: `Playing ${result.title}`})}
                  playButtonText="Play (Mock)"
                />
              ))}
              </div>
            </div>
          )}
          {!isMockLoading && !hasMockSearched && (
             <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg my-6">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">Start by searching the mock library</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* YouTube Music Search Section */}
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
           <CardTitle className="font-headline text-2xl flex items-center">
            <Youtube className="mr-2 h-7 w-7 text-red-600" />
            Search YouTube Music
          </CardTitle>
          <CardDescription>
            Find tracks on YouTube Music. (Requires API configuration from your side in <code>.env</code> and <code>youtubeMusicActions.ts</code>)
          </CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleYoutubeMusicSearch} className="flex gap-2 mb-6">
            <Input
              type="search"
              placeholder="Search YouTube Music..."
              value={ytSearchTerm}
              onChange={(e) => setYtSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isYtLoading} variant="default">
              {isYtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Search YouTube</span>
            </Button>
          </form>

          {isYtLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Searching YouTube Music...</p>
            </div>
          )}

          {!isYtLoading && hasYtSearched && ytResults.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No YouTube Music results</p>
              <p className="text-sm text-muted-foreground">
                {`No results for "${ytSearchTerm}" or API needs configuration.`}
              </p>
            </div>
          )}

          {!isYtLoading && ytResults.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold mb-2">
                {`YouTube Music Results for "${ytSearchTerm}"`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ytResults.map((track) => (
                  <SongCard
                    key={track.id}
                    title={track.title}
                    artist={track.artist}
                    albumArtUrl={track.thumbnailUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(track.title.substring(0,10))}`}
                    data-ai-hint="youtube music thumbnail"
                    onPlay={() => window.open(track.youtubeVideoUrl, "_blank")}
                    playButtonText="Play on YouTube"
                    playButtonIcon={ExternalLink}
                  />
                ))}
              </div>
            </div>
          )}
          {!isYtLoading && !hasYtSearched && (
             <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg my-6">
                <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">Search for tracks on YouTube Music</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
