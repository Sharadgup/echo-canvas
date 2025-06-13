
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, Square, Loader2, Search, Youtube, Play, AlertTriangle, Info, Music, Heart, X, ChevronDown, ChevronUp, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeAudioForSearchAction } from "@/app/actions/aiActions";
import type { AnalyzeAudioOutput } from "@/ai/flows/analyze-audio-for-search-flow";
import { searchYoutubeMusicAction, type YouTubeMusicSearchResult } from "@/app/actions/youtubeMusicActions";
import SongCard from "@/components/playlist/SongCard";
import { useAuthContext } from "@/context/AuthContext";
import { toggleLikeSongAction, getLikedSongIdsAction } from "@/app/actions/likedMusicActions";
import Image from "next/image";
import YouTubeLyricsDisplay from "../youtube/YouTubeLyricsDisplay";
import { cn } from "@/lib/utils";

type AnalysisStep = "idle" | "requestingPermission" | "permissionDenied" | "listening" | "processingAudio" | "analyzing" | "searching" | "results" | "error";

export default function VoiceAnalyzerClient() {
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<AnalysisStep>("idle");
  
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [micError, setMicError] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<AnalyzeAudioOutput | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [youtubeResults, setYoutubeResults] = useState<YouTubeMusicSearchResult[]>([]);
  
  const [currentPlayingYoutubeTrack, setCurrentPlayingYoutubeTrack] = useState<YouTubeMusicSearchResult | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [isPlayerBarPlaying, setIsPlayerBarPlaying] = useState(false);
  const [likedYouTubeTrackIds, setLikedYouTubeTrackIds] = useState<Set<string>>(new Set());

  // Refs for animation
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [audioActivity, setAudioActivity] = useState(0);


  useEffect(() => {
    if (user) {
      getLikedSongIdsAction(user.uid, 'youtube').then(ids => {
        setLikedYouTubeTrackIds(new Set(ids));
      });
    }
  }, [user]);

  const resetState = (nextStep: AnalysisStep = "idle") => {
    setAudioBlob(null);
    setAudioDataUri(null);
    setAnalysisResult(null);
    setYoutubeResults([]);
    setApiError(null);
    setMicError(null);
    setCurrentStep(nextStep);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // audioContextRef.current.close(); // Closing causes issues with re-init
        // audioContextRef.current = null;
    }
    if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setAudioActivity(0);
  };
  
  const drawAudioVisualizer = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const average = sum / dataArrayRef.current.length;
      setAudioActivity(Math.min(1, average / 128)); // Normalize to 0-1
    }
    animationFrameRef.current = requestAnimationFrame(drawAudioVisualizer);
  }, []);


  const startRecordingFlow = async () => {
    resetState("requestingPermission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Web Audio API for visualizer
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      // Do not connect analyser to destination to avoid feedback

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        if (sourceRef.current) sourceRef.current.disconnect();
        if (analyserRef.current) analyserRef.current.disconnect();
        // audioContextRef.current?.close(); // Potential issue here if closed too early
        stream.getTracks().forEach(track => track.stop());
        if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioActivity(0);

        const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(completeAudioBlob);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioDataUri(reader.result as string);
          // Automatically proceed to analysis
          if (reader.result) {
            handleFullAnalysis(reader.result as string);
          } else {
            setApiError("Failed to read audio data after recording.");
            setCurrentStep("error");
          }
        };
        reader.readAsDataURL(completeAudioBlob);
        setCurrentStep("processingAudio");
      };

      mediaRecorderRef.current.start();
      setCurrentStep("listening");
      toast({ title: "Listening...", description: "Tap the icon to stop." });
      drawAudioVisualizer();

    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      let message = "Could not access microphone.";
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        message = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        message = "Microphone access denied. Please allow microphone access in your browser settings.";
      }
      setMicError(message);
      setCurrentStep("permissionDenied");
      toast({ variant: "destructive", title: "Microphone Error", description: message });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && currentStep === "listening") {
      mediaRecorderRef.current.stop(); 
      // onstop will handle next steps
    }
  };
  
  const handleFullAnalysis = async (dataUri: string) => {
    setCurrentStep("analyzing");
    setAnalysisResult(null);
    setYoutubeResults([]);
    setApiError(null);

    try {
      const aiResponse = await analyzeAudioForSearchAction({ audioDataUri: dataUri });
      if (aiResponse.error) {
        setApiError(aiResponse.message);
        setCurrentStep("error");
        toast({ variant: "destructive", title: "AI Analysis Failed", description: aiResponse.message });
        return;
      }
      setAnalysisResult(aiResponse as AnalyzeAudioOutput);
      toast({ title: "AI Analysis Complete" });

      if ((aiResponse as AnalyzeAudioOutput).searchQuery) {
        setCurrentStep("searching");
        const youtubeResponse = await searchYoutubeMusicAction((aiResponse as AnalyzeAudioOutput).searchQuery);
        setYoutubeResults(youtubeResponse.results);
        if (youtubeResponse.results.length === 0) {
            toast({ title: "YouTube Search", description: "No results found for the AI generated query." });
        }
        setCurrentStep("results");
      } else {
        setApiError("AI did not provide a search query.");
        setCurrentStep("results"); // Show analysis notes even if no query
      }
    } catch (error: any) {
      console.error("Error during analysis or search:", error);
      setApiError("An unexpected error occurred during AI analysis or YouTube search.");
      setCurrentStep("error");
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    }
  };

  const handleMainButtonClick = () => {
    if (currentStep === "idle" || currentStep === "results" || currentStep === "error" || currentStep === "permissionDenied") {
      startRecordingFlow();
    } else if (currentStep === "listening") {
      stopRecording();
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

  const renderCentralButtonAndStatus = () => {
    let icon = <Mic className="h-16 w-16" />;
    let text = "Tap to Analyze";
    let subtext = "Record any sound or song";
    let buttonColor = "bg-primary hover:bg-primary/90";
    let isPulsing = false;

    switch (currentStep) {
      case "requestingPermission":
        icon = <Loader2 className="h-16 w-16 animate-spin" />;
        text = "Requesting Mic...";
        subtext = "Please allow microphone access.";
        break;
      case "permissionDenied":
        icon = <AlertTriangle className="h-16 w-16 text-destructive" />;
        text = "Permission Denied";
        subtext = micError || "Please enable microphone access in browser settings.";
        buttonColor = "bg-muted hover:bg-muted/80";
        break;
      case "listening":
        icon = <Square className="h-16 w-16" />;
        text = "Listening...";
        subtext = "Tap icon to stop";
        buttonColor = "bg-red-500 hover:bg-red-600";
        isPulsing = true;
        break;
      case "processingAudio":
      case "analyzing":
        icon = <Loader2 className="h-16 w-16 animate-spin" />;
        text = "Processing...";
        subtext = currentStep === "analyzing" ? "AI is analyzing your audio..." : "Finalizing audio...";
        break;
      case "searching":
        icon = <Loader2 className="h-16 w-16 animate-spin" />;
        text = "Searching...";
        subtext = "Looking for matches on YouTube...";
        break;
      case "results":
         icon = <Mic className="h-16 w-16" />;
         text = "Analyze New Sound";
         subtext = "Tap to start over";
        break;
      case "error":
        icon = <AlertTriangle className="h-16 w-16 text-destructive" />;
        text = "Try Again";
        subtext = apiError || "An error occurred.";
        buttonColor = "bg-muted hover:bg-muted/80";
        break;
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 min-h-[calc(100vh-20rem)] sm:min-h-[calc(100vh-25rem)]">
        <Button
          onClick={handleMainButtonClick}
          disabled={currentStep === "requestingPermission" || currentStep === "processingAudio" || currentStep === "analyzing" || currentStep === "searching"}
          className={cn(
            "rounded-full h-48 w-48 flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105",
            buttonColor,
            isPulsing && "animate-pulse-strong"
          )}
          aria-label={text}
        >
          {icon}
        </Button>
        <h2 className="text-2xl font-semibold mt-6">{text}</h2>
        <p className="text-muted-foreground">{subtext}</p>
        
        {currentStep === "listening" && (
           <div className="w-24 h-10 flex justify-around items-end">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 bg-card-foreground/70 rounded-t-sm"
                style={{
                  height: `${Math.max(5, audioActivity * (60 + Math.random() * 20))}px`,
                  transition: 'height 0.1s ease-out',
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-6 pb-16"> {/* Added padding bottom for player bar */}
      {currentPlayingYoutubeTrack && (
         <div className="sticky top-[65px] z-40 space-y-2"> {/* Ensure this z-index is higher than content, lower than modals/header */}
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
                      {isPlayerBarPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
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
                    {isPlayerBarPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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

      {renderCentralButtonAndStatus()}
      
      {currentStep === "results" && (
        <div className="mt-8 space-y-6">
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 bg-muted/30 rounded-md">
                <div>
                  <h4 className="font-semibold text-primary">Generated Search Query:</h4>
                  <p className="text-sm font-mono p-2 bg-background rounded">{analysisResult.searchQuery || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Analysis Notes:</h4>
                  <p className="text-sm">{analysisResult.analysisNotes}</p>
                </div>
                {audioDataUri && (
                    <div className="pt-2">
                        <h4 className="font-semibold text-primary mb-1">Recorded Audio:</h4>
                        <audio controls src={audioDataUri} className="w-full" />
                    </div>
                )}
              </CardContent>
            </Card>
          )}

          {apiError && !analysisResult && ( // Show API error if analysis failed but we are in 'results' step due to no query
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Problem during Analysis/Search</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {youtubeResults.length > 0 && (
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
          
          {analysisResult && analysisResult.searchQuery && youtubeResults.length === 0 && (
             <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4"/>
                <AlertTitle>No YouTube Results</AlertTitle>
                <AlertDescription>
                    The AI analysis completed, but no relevant YouTube tracks were found for the query: "{analysisResult.searchQuery}".
                </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

