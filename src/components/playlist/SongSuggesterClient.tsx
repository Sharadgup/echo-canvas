"use client";

import { useState } from "react";
import { suggestNextSong, SuggestNextSongInput, SuggestNextSongOutput } from "@/ai/flows/suggest-next-song";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lightbulb } from "lucide-react";

interface SongSuggesterClientProps {
  listeningHistory: string[];
  currentSong: string | null;
  onSongSuggested: (suggestion: SuggestNextSongOutput) => void;
}

export default function SongSuggesterClient({ listeningHistory, currentSong, onSongSuggested }: SongSuggesterClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestNextSongOutput | null>(null);
  const { toast } = useToast();

  const handleSuggestSong = async () => {
    if (!currentSong) {
      toast({ title: "No Current Song", description: "Please select a song first to get suggestions.", variant: "default" });
      return;
    }
    if (listeningHistory.length === 0 && currentSong) {
        listeningHistory = [currentSong]; // Use current song as history if none exists
    }


    setIsLoading(true);
    setSuggestion(null);
    try {
      const input: SuggestNextSongInput = { listeningHistory, currentSong };
      const result = await suggestNextSong(input);
      setSuggestion(result);
      onSongSuggested(result); 
      toast({ title: "Next Song Suggested!", description: `How about "${result.nextSong}"?` });
    } catch (error) {
      console.error("Error suggesting song:", error);
      toast({ title: "Error", description: "Could not suggest a song. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Lightbulb className="mr-2 h-6 w-6 text-yellow-400" />
          Discover Your Next Favorite
        </CardTitle>
        <CardDescription>Let our AI find the perfect next track based on your current vibe.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSuggestSong} disabled={isLoading || !currentSong} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : (
            "Suggest Next Song"
          )}
        </Button>
        {suggestion && !isLoading && (
          <div className="mt-6 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold text-lg text-primary">{suggestion.nextSong}</h4>
            <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
