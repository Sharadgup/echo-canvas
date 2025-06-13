
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Lightbulb, Loader2, Zap } from 'lucide-react';
import type { Song } from './UserSongsList'; // Assuming UserSongsList exports Song type
import { suggestRemixStyleAction } from '@/app/actions/aiActions';
import type { RemixSuggestion } from '@/ai/flows/suggest-remix-style';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface TrackCardDashboardProps {
  song: Song;
}

export default function TrackCardDashboard({ song }: TrackCardDashboardProps) {
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<RemixSuggestion | null>(null);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePlay = () => {
    // Placeholder for actual play functionality
    console.log(`Playing ${song.title} - ${song.audioUrl}`);
    toast({ title: "Playback Started (Mock)", description: `Playing ${song.title}`});
  };

  const handleGetAiSuggestion = async () => {
    setIsLoadingAi(true);
    setAiSuggestion(null);
    setAiSuggestionError(null); // Reset error state
    setIsDialogOpen(true);
    try {
      const result = await suggestRemixStyleAction({
        title: song.title,
        artist: song.artist,
        // We could add current style/genre if we stored it
      });

      if (result && 'error' in result && result.error === true) {
        console.error("AI Suggestion Failed (handled):", result.message);
        const errorMessage = result.message || "Could not get a remix suggestion. Please try again.";
        toast({
          title: "AI Suggestion Failed",
          description: errorMessage,
          variant: "destructive",
        });
        setAiSuggestionError(errorMessage);
      } else if (result) {
        setAiSuggestion(result as RemixSuggestion); // Type assertion, as 'error' in result is false or not present
        setAiSuggestionError(null);
      } else {
        // Handle unexpected null/undefined result from action
        const genericErrorMsg = "Received an unexpected empty response from the AI suggestion service.";
         toast({
          title: "AI Suggestion Failed",
          description: genericErrorMsg,
          variant: "destructive",
        });
        setAiSuggestionError(genericErrorMsg);
      }
    } catch (error: any) { // Catch unexpected network errors or if the action itself throws before returning ActionError
      console.error("Error calling AI suggestion action:", error);
      const networkErrorMsg = "An unexpected network error occurred while fetching AI suggestions. Please check your connection and try again.";
      toast({
        title: "Network Error",
        description: networkErrorMsg,
        variant: "destructive",
      });
      setAiSuggestionError(networkErrorMsg);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-md">
          <Image
            src={`https://placehold.co/300x300.png?text=${encodeURIComponent(song.title.substring(0,15))}`}
            alt={song.title}
            fill
            className="object-cover"
            data-ai-hint="music album art"
          />
        </div>
        <CardTitle className="truncate text-xl font-headline" title={song.title}>{song.title}</CardTitle>
        <CardDescription className="truncate" title={song.artist}>{song.artist || 'Unknown Artist'}</CardDescription>
        <CardDescription className="text-xs">
            Uploaded: {song.uploadedAt instanceof Date ? song.uploadedAt.toLocaleDateString() : 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Additional content can go here if needed */}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button variant="outline" onClick={handlePlay} className="w-full sm:w-auto flex-grow">
          <PlayCircle className="mr-2 h-5 w-5" /> Play
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { // Reset states when dialog is closed
            setAiSuggestion(null);
            setAiSuggestionError(null);
            setIsLoadingAi(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="secondary" onClick={handleGetAiSuggestion} className="w-full sm:w-auto flex-grow" disabled={isLoadingAi && isDialogOpen}>
              {(isLoadingAi && isDialogOpen) ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-5 w-5" />
              )}
              AI Remix
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-primary" />
                AI Remix Suggestion for {song.title}
              </DialogTitle>
              <DialogDescription>
                Let our AI spark your creativity with new remix ideas!
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto min-h-[100px]">
              {isLoadingAi && (
                <div className="flex flex-col items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">Generating ideas...</p>
                </div>
              )}
              {!isLoadingAi && aiSuggestionError && (
                 <p className="text-sm text-destructive text-center p-4">{aiSuggestionError}</p>
              )}
              {!isLoadingAi && !aiSuggestionError && aiSuggestion && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary">Suggested Style:</h4>
                    <p>{aiSuggestion.suggestedStyle}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Creative Ideas:</h4>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      {aiSuggestion.ideas.map((idea, index) => (
                        <li key={index}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Reasoning:</h4>
                    <p className="text-sm text-muted-foreground">{aiSuggestion.reasoning}</p>
                  </div>
                </div>
              )}
               {!isLoadingAi && !aiSuggestionError && !aiSuggestion && (
                <p className="text-sm text-muted-foreground text-center p-4">AI suggestion will appear here.</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
