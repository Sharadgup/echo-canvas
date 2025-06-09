
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
    setIsDialogOpen(true); 
    try {
      const suggestion = await suggestRemixStyleAction({ 
        title: song.title, 
        artist: song.artist,
        // We could add current style/genre if we stored it
      });
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({
        title: "AI Suggestion Failed",
        description: "Could not get a remix suggestion. Please try again.",
        variant: "destructive",
      });
      setIsDialogOpen(false); // Close dialog on error
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" onClick={handleGetAiSuggestion} className="w-full sm:w-auto flex-grow" disabled={isLoadingAi}>
              {isLoadingAi && !aiSuggestion ? (
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
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {isLoadingAi && !aiSuggestion && (
                <div className="flex flex-col items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">Generating ideas...</p>
                </div>
              )}
              {aiSuggestion && (
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
              {!isLoadingAi && !aiSuggestion && error && (
                 <p className="text-sm text-destructive">Failed to load suggestion.</p>
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
