
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Music, Play, Heart } from "lucide-react"; 
import SongCard from "@/components/playlist/SongCard";
import { useToast } from "@/hooks/use-toast";

// This component now ONLY handles the MOCK search functionality.
// YouTube Music search has been moved to YouTubeMusicSearchPlayer.tsx

interface MockSearchResult {
  id: string; 
  title: string;
  artist: string;
  type: "song" | "artist";
  albumArtUrl?: string;
}

export default function SearchClient() {
  const [mockSearchTerm, setMockSearchTerm] = useState("");
  const [mockResults, setMockResults] = useState<MockSearchResult[]>([]);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const [hasMockSearched, setHasMockSearched] = useState(false);
  const [likedMockTracks, setLikedMockTracks] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  const handleMockSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockSearchTerm.trim()) return;

    setIsMockLoading(true);
    setHasMockSearched(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

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

  const handleLikeMockTrack = (track: MockSearchResult) => {
    setLikedMockTracks(prevLiked => {
      const newLiked = new Set(prevLiked);
      if (newLiked.has(track.id)) {
        newLiked.delete(track.id);
        toast({ title: "Unliked (Mock)", description: `${track.title} removed from mock likes.` });
      } else {
        newLiked.add(track.id);
        toast({ title: "Liked! (Mock)", description: `${track.title} added to mock likes.` });
      }
      return newLiked;
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Music className="mr-2 h-7 w-7 text-accent" />
          Mock Music Search
        </CardTitle>
        <CardDescription>
          Test the search interface with pre-defined mock data. Try "love" or "rock".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMockSearch} className="flex gap-2 mb-6">
          <Input
            type="search"
            placeholder="Search mock songs (e.g., love, rock)..."
            value={mockSearchTerm}
            onChange={(e) => setMockSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={isMockLoading} variant="secondary">
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
                playButtonIcon={Play}
                onLike={() => handleLikeMockTrack(result)}
                isLiked={likedMockTracks.has(result.id)}
                likeButtonIcon={Heart}
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
  );
}
