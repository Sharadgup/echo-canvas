
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Loader2, Search, Youtube, Play, AlertTriangle, Info, Music, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeAudioForSearchAction } from "@/app/actions/aiActions";
import type { AnalyzeAudioOutput } from "@/ai/flows/analyze-audio-for-search-flow";
import { searchYoutubeMusicAction, type YouTubeMusicSearchResult } from "@/app/actions/youtubeMusicActions";
import SongCard from "@/components/playlist/SongCard"; // Reusing SongCard
import YouTubeMusicSearchPlayer from "@/components/youtube/YouTubeMusicSearchPlayer"; // To reuse parts of the player logic if needed or for consistency
import { useAuthContext } from "@/context/AuthContext";
import { toggleLikeSongAction, getLikedSongIdsAction } from "@/app/actions/likedMusicActions";
import Image from "next/image";
import YouTubeLyricsDisplay from "../youtube/YouTubeLyricsDisplay";


export default function VoiceAnalyzerClient() {
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isLoadingMicPermission, setIsLoadingMicPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeAudioOutput | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [youtubeResults, setYoutubeResults] = useState<YouTubeMusicSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [currentPlayingYoutubeTrack, setCurrentPlayingYoutubeTrack] = useState<YouTubeMusicSearchResult | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [isPlayerBarPlaying, setIsPlayerBarPlaying] = useState(false);
  const [likedYouTubeTrackIds, setLikedYouTubeTrackIds] = useState<Set<string>>(new Set());


  useEffect(() => {
    if (user) {
      getLikedSongIdsAction(user.uid, 'youtube').then(ids => {
        setLikedYouTubeTrackIds(new Set(ids));
      });
    }
  }, [user]);

  const requestMicPermission = async () => {
    setIsLoadingMicPermission(true);
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      // We don't need to do anything with the stream directly here,
      // as MediaRecorder will use it. We can close this initial stream.
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      setHasMicPermission(false);
      let message = "Could not access microphone.";
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        message = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        message = "Microphone access denied. Please allow microphone access in your browser settings.";
      }
      setMicError(message);
      toast({ variant: "destructive", title: "Microphone Error", description: message });
    } finally {
      setIsLoadingMicPermission(false);
    }
  };

  const startRecording = async () => {
    if (!hasMicPermission) {
      await requestMicPermission();
      // If permission is still not granted after request, return
      if (!hasMicPermission && !navigator.mediaDevices.getUserMedia) { // Recheck after trying
         toast({ variant: "destructive", title: "Microphone Required", description: "Microphone permission is needed to record audio." });
         return;
      }
    }
    
    // Check again, as requestMicPermission updates hasMicPermission asynchronously
    // Need a slight delay or a more robust way to ensure hasMicPermission is current
    // For now, let's assume if it reached here after await, it tried.
    // A better way would be for requestMicPermission to return a boolean.

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Use webm, more widely supported by Gemini
            setAudioBlob(completeAudioBlob);
            const reader = new FileReader();
            reader.onloadend = () => {
            setAudioDataUri(reader.result as string);
            };
            reader.readAsDataURL(completeAudioBlob);
            stream.getTracks().forEach(track => track.stop()); // Stop mic access
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setAudioBlob(null);
        setAudioDataUri(null);
        setAnalysisResult(null);
        setYoutubeResults([]);
        setAnalysisError(null);
        setSearchError(null);
        toast({ title: "Recording Started", description: "Speak or play a sound..." });
    } catch (error) {
        // This catch is for the second attempt if the first permission check failed
        console.error("Error starting recording after permission attempt:", error);
        toast({ variant: "destructive", title: "Recording Failed", description: "Could not start recording. Ensure microphone is allowed." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording Stopped" });
    }
  };

  const handleAnalyzeAndSearch = async () => {
    if (!audioDataUri) {
      toast({ variant: "destructive", title: "No Audio", description: "Please record audio first." });
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysisResult(null);
    setYoutubeResults([]);
    setAnalysisError(null);
    setSearchError(null);

    try {
      const aiResponse = await analyzeAudioForSearchAction({ audioDataUri });
      if (aiResponse.error) {
        setAnalysisError(aiResponse.message);
        toast({ variant: "destructive", title: "AI Analysis Failed", description: aiResponse.message });
        setIsLoadingAnalysis(false);
        return;
      }
      setAnalysisResult(aiResponse as AnalyzeAudioOutput); // Type assertion
      setIsLoadingAnalysis(false);
      toast({ title: "AI Analysis Complete" });

      // Now search YouTube
      if ((aiResponse as AnalyzeAudioOutput).searchQuery) {
        setIsLoadingSearch(true);
        const youtubeResponse = await searchYoutubeMusicAction((aiResponse as AnalyzeAudioOutput).searchQuery);
        setYoutubeResults(youtubeResponse.results);
        if (youtubeResponse.results.length === 0) {
            toast({ title: "YouTube Search", description: "No results found for the AI generated query." });
        }
        setIsLoadingSearch(false);
      }
    } catch (error: any) {
      console.error("Error during analysis or search:", error);
      setAnalysisError("An unexpected error occurred during AI analysis.");
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      setIsLoadingAnalysis(false);
      setIsLoadingSearch(false);
    }
  };
  
  const handleSelectTrackForPlayer = (track: YouTubeMusicSearchResult) => {
    setCurrentPlayingYoutubeTrack(track);
    setIsPlayerMinimized(false);
    setIsPlayerBarPlaying(true);
  };

  const handleTogglePlayerBarPlayPause = () => {
    if (!currentPlayingYoutubeTrack) return;
    setIsPlayerBarPlaying(!isPlayerBarPlaying);
  };

  const handleMinimizePlayer = () => setIsPlayerMinimized(true);
  const handleMaximizePlayer = () => setIsPlayerMinimized(false);

  const handleClosePlayer = () => {
    setCurrentPlayingYoutubeTrack(null);
    setIsPlayerBarPlaying(false);
  };
  
  const handleToggleLikeTrack = async (track: YouTubeMusicSearchResult) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to like songs.", variant: "default" });
      return;
    }
    try {
      const result = await toggleLikeSongAction({
        userId: user.uid,
        songId: track.videoId,
        title: track.title,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
        source: 'youtube',
        youtubeVideoUrl: track.youtubeVideoUrl,
      });

      setLikedYouTubeTrackIds(prevLiked => {
        const newLiked = new Set(prevLiked);
        if (result.liked) {
          newLiked.add(track.videoId);
          toast({ title: "Liked!", description: `${track.title} added to your music.` });
        } else {
          newLiked.delete(track.videoId);
          toast({ title: "Unliked", description: `${track.title} removed from your music.` });
        }
        return newLiked;
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update like status.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-6">
       {currentPlayingYoutubeTrack && (
         <div className="sticky top-[70px] z-30 space-y-2">
          {!isPlayerMinimized ? (
            <Card className="shadow-xl border-primary bg-background/95 backdrop-blur-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-lg font-headline truncate">
                    <Music className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                    <span className="truncate" title={currentPlayingYoutubeTrack.title}>
                        Now Playing: {currentPlayingYoutubeTrack.title}
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={handleTogglePlayerBarPlayPause} aria-label={isPlayerBarPlaying ? "Pause" : "Play"}>
                      {isPlayerBarPlaying ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleMinimizePlayer} aria-label="Minimize player">
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleClosePlayer} aria-label="Close player">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="truncate" title={currentPlayingYoutubeTrack.artist}>{currentPlayingYoutubeTrack.artist}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-2">
                {currentPlayingYoutubeTrack.thumbnailUrl && (
                  <Image
                    src={currentPlayingYoutubeTrack.thumbnailUrl.replace('mqdefault.jpg', 'hqdefault.jpg')}
                    alt={`Thumbnail for ${currentPlayingYoutubeTrack.title}`}
                    width={320}
                    height={180}
                    className="rounded-md shadow-md mb-4"
                    data-ai-hint="music video thumbnail"
                    priority={true}
                  />
                )}
                {isPlayerBarPlaying && (
                  <iframe
                    key={currentPlayingYoutubeTrack.videoId + "-voice-analysis-player"}
                    width="0"
                    height="0"
                    style={{ position: 'absolute', top: '-9999px', left: '-9999px', border: 'none' }}
                    src={`https://www.youtube.com/embed/${currentPlayingYoutubeTrack.videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title="YouTube audio player (hidden)"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  ></iframe>
                )}
                 {!isPlayerBarPlaying && (
                    <div className="w-full h-[180px] bg-muted flex items-center justify-center rounded-md my-4">
                        <p className="text-muted-foreground">Paused</p>
                    </div>
                 )}
              </CardContent>
              {isPlayerBarPlaying && (
                <YouTubeLyricsDisplay
                  videoId={currentPlayingYoutubeTrack.videoId}
                  videoTitle={currentPlayingYoutubeTrack.title}
                />
              )}
            </Card>
          ) : (
            <Card className="shadow-lg bg-background/95 backdrop-blur-md p-2">
              <div className="flex items-center justify-between space-x-2">
                {currentPlayingYoutubeTrack.thumbnailUrl && (
                  <Image
                    src={currentPlayingYoutubeTrack.thumbnailUrl}
                    alt="mini thumbnail"
                    width={40}
                    height={40}
                    className="rounded flex-shrink-0"
                    data-ai-hint="song thumbnail"
                  />
                )}
                <div className="flex-grow overflow-hidden mx-2">
                  <p className="text-sm font-semibold truncate" title={currentPlayingYoutubeTrack.title}>{currentPlayingYoutubeTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate" title={currentPlayingYoutubeTrack.artist}>{currentPlayingYoutubeTrack.artist}</p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={handleTogglePlayerBarPlayPause} aria-label={isPlayerBarPlaying ? "Pause" : "Play"}>
                    {isPlayerBarPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleMaximizePlayer} aria-label="Maximize player">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleClosePlayer} aria-label="Close player">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">1. Record Audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasMicPermission === false && micError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Microphone Access Denied</AlertTitle>
              <AlertDescription>{micError}</AlertDescription>
            </Alert>
          )}
           {hasMicPermission === null && (
             <Button onClick={requestMicPermission} disabled={isLoadingMicPermission} className="w-full">
              {isLoadingMicPermission ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
              Request Microphone Permission
            </Button>
           )}

          {hasMicPermission && (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={startRecording} disabled={isRecording} className="flex-1">
                <Mic className="mr-2 h-4 w-4" /> Start Recording
              </Button>
              <Button onClick={stopRecording} disabled={!isRecording} variant="outline" className="flex-1">
                <Square className="mr-2 h-4 w-4" /> Stop Recording
              </Button>
            </div>
          )}
          {isRecording && (
            <div className="text-center text-primary font-medium p-2 bg-primary/10 rounded-md">
              Recording in progress...
            </div>
          )}
          {audioDataUri && !isRecording && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recorded Audio:</p>
              <audio controls src={audioDataUri} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {audioDataUri && !isRecording && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">2. Analyze & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAnalyzeAndSearch} disabled={isLoadingAnalysis || isLoadingSearch} className="w-full">
              {(isLoadingAnalysis || isLoadingSearch) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {isLoadingAnalysis ? "Analyzing Audio..." : isLoadingSearch ? "Searching YouTube..." : "Analyze Audio & Search YouTube"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoadingAnalysis && (
        <div className="text-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">AI is analyzing your audio...</p>
        </div>
      )}

      {analysisError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Analysis Failed</AlertTitle>
          <AlertDescription>{analysisError}</AlertDescription>
        </Alert>
      )}

      {analysisResult && !isLoadingAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 bg-muted/30 rounded-md">
            <div>
              <h4 className="font-semibold text-primary">Generated Search Query:</h4>
              <p className="text-sm font-mono p-2 bg-background rounded">{analysisResult.searchQuery}</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary">Analysis Notes:</h4>
              <p className="text-sm">{analysisResult.analysisNotes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingSearch && (
        <div className="text-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Searching YouTube for related music...</p>
        </div>
      )}
      
      {searchError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>YouTube Search Failed</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {youtubeResults.length > 0 && !isLoadingSearch && (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center">
                    <Youtube className="mr-2 h-5 w-5 text-red-500" /> YouTube Search Results
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {youtubeResults.map((track) => (
                    <SongCard
                        key={track.videoId}
                        title={track.title}
                        artist={track.artist}
                        albumArtUrl={track.thumbnailUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(track.title.substring(0,10))}`}
                        data-ai-hint="youtube music"
                        onPlay={() => handleSelectTrackForPlayer(track)}
                        playButtonText="Play Audio"
                        playButtonIcon={Play}
                        isActive={currentPlayingYoutubeTrack?.videoId === track.videoId && isPlayerBarPlaying}
                        onLike={() => handleToggleLikeTrack(track)}
                        isLiked={likedYouTubeTrackIds.has(track.videoId)}
                        likeButtonIcon={Heart}
                    />
                    ))}
                </div>
            </CardContent>
        </Card>
      )}
      
      {!isLoadingAnalysis && !isLoadingSearch && analysisResult && youtubeResults.length === 0 && (
         <Alert variant="default" className="mt-4">
            <Info className="h-4 w-4"/>
            <AlertTitle>No YouTube Results</AlertTitle>
            <AlertDescription>
                The AI analysis completed, but no relevant YouTube tracks were found for the query: "{analysisResult.searchQuery}". You could try recording again or being more distinct with your sound.
            </AlertDescription>
        </Alert>
      )}

    </div>
  );
}
