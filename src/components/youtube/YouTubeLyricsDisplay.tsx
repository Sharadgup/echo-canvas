
"use client";

import { fetchYouTubeVideoCaptionsAction } from "@/app/actions/youtubeCaptionActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, VenetianMask } from "lucide-react";
import { useEffect, useState } from "react";

interface YouTubeLyricsDisplayProps {
  videoId: string;
  videoTitle: string;
}

export default function YouTubeLyricsDisplay({ videoId, videoTitle }: YouTubeLyricsDisplayProps) {
  const [lyricsLines, setLyricsLines] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    setIsLoading(true);
    setLyricsLines(null);
    setError(null);

    const getCaptions = async () => {
      try {
        const lines = await fetchYouTubeVideoCaptionsAction(videoId);
        setLyricsLines(lines);
      } catch (err: any) {
        console.error("Failed to fetch or process captions:", err);
        setError("Could not load lyrics for this track.");
      } finally {
        setIsLoading(false);
      }
    };

    getCaptions();
  }, [videoId]);

  return (
    <Card className="shadow-md mt-4 border-accent">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
            <VenetianMask className="mr-2 h-5 w-5 text-accent"/>
            Lyrics / Captions 
        </CardTitle>
        <CardDescription className="text-xs truncate" title={videoTitle}>
            For: {videoTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-6 min-h-[150px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading lyrics...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center p-6 min-h-[150px]">
            <p className="text-destructive">{error}</p>
          </div>
        )}
        {!isLoading && !error && lyricsLines && lyricsLines.length > 0 && (
          <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-muted/20 text-sm">
            {lyricsLines.map((line, index) => (
              <p key={index} className="mb-1.5 leading-relaxed">
                {line}
              </p>
            ))}
          </ScrollArea>
        )}
        {!isLoading && !error && (!lyricsLines || lyricsLines.length === 0) && (
          <div className="text-center p-6 min-h-[150px]">
            <p className="text-muted-foreground">No lyrics or captions available for this track.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    