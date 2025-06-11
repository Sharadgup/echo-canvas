
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Music2, PlayCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

interface SongCardProps {
  title: string;
  artist?: string;
  albumArtUrl?: string;
  onPlay?: () => void;
  isActive?: boolean;
  playButtonText?: string;
  playButtonIcon?: React.ElementType; // Lucide icon component type
}

export default function SongCard({ title, artist, albumArtUrl, onPlay, isActive, playButtonText, playButtonIcon: PlayButtonIconComponent }: SongCardProps) {
  return (
    <Card className={`transition-all duration-300 ease-in-out hover:shadow-xl ${isActive ? 'ring-2 ring-primary shadow-xl' : 'shadow-md'}`}>
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <div className="flex-shrink-0">
          {albumArtUrl ? (
            <Image
              src={albumArtUrl}
              alt={title}
              width={64}
              height={64}
              className="rounded-md object-cover h-16 w-16"
              data-ai-hint="album cover"
            />
          ) : (
            <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
              <Music2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <CardTitle className="truncate font-semibold text-lg">{title}</CardTitle>
          {artist && <CardDescription className="truncate">{artist}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent>
        {onPlay && (
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={onPlay}>
            {PlayButtonIconComponent ? <PlayButtonIconComponent className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            {playButtonText || (isActive ? "Playing" : "Set as Current")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
