"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Music } from "lucide-react";
import SongCard from "@/components/playlist/SongCard"; // Re-use for displaying results

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  type: "song" | "artist";
}

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Placeholder results - in a real app, this would call an API
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

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl flex items-center justify-center">
          <SearchIcon className="mr-3 h-8 w-8 text-primary" />
          Find Your Music
        </CardTitle>
        <CardDescription>Search for your favorite songs and artists across Echo Canvas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            type="search"
            placeholder="Search for songs or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Search</span>
          </Button>
        </form>

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Searching...</p>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No results found for "{searchTerm}"</p>
            <p className="text-sm text-muted-foreground">Try a different search term or check your spelling.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-2">Search Results for "{searchTerm}"</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((result) => (
              <SongCard 
                key={result.id} 
                title={result.title} 
                artist={result.type === "song" ? result.artist : undefined}
                albumArtUrl={`https://placehold.co/300x300.png?text=${encodeURIComponent(result.title.substring(0,10))}`}
                data-ai-hint="music album"
              />
            ))}
            </div>
          </div>
        )}
         {!isLoading && !hasSearched && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Start by typing your query</p>
            <p className="text-sm text-muted-foreground">Discover songs, artists, and more.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
