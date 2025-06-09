
// @ts-nocheck
"use client";

import * as Tone from 'tone';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Play, Pause, StopCircle, RefreshCw, Zap, Square, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  originalUrl: string; // Keep original URL for reset
  currentUrl: string; // Can be original URL or object URL
  file?: File;
  isCustom?: boolean;
  isPlaying: boolean;
  volume: number; // 0-1 for UI
  delayWet: number; // 0-1 for UI
  delayTime: number; // 0-1 for UI (maps to 0-1 seconds)
  delayFeedback: number; // 0-1 for UI
  isMuted: boolean;
  loop: boolean;
}

const initialTracksData: Omit<Track, 'originalUrl' | 'currentUrl' | 'file' | 'isCustom' | 'isPlaying' | 'volume' | 'delayWet' | 'delayTime' | 'delayFeedback' | 'isMuted' | 'loop'> & { url: string }[] = [
  { id: 'track1', title: 'Ominous Loop', url: 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/drum-samples/loops/ominous.mp3' },
  { id: 'track2', title: 'Casio Synth C2', url: 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/casio/C2.mp3' },
  { id: 'track3', title: 'Gabba Kick Loop', url: 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/drum-samples/Loops/gabba.mp3' },
];

const getDefaultTracks = (): Track[] => initialTracksData.map(t => ({
    ...t,
    originalUrl: t.url,
    currentUrl: t.url,
    file: undefined,
    isCustom: false,
    isPlaying: false,
    volume: 0.75,
    delayWet: 0,
    delayTime: 0.2,
    delayFeedback: 0.3,
    isMuted: false,
    loop: t.title.includes('Loop'), // Default loop for tracks with "Loop" in title
}));


export default function MixerClient() {
  const [tracks, setTracks] = useState<Track[]>(getDefaultTracks());
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const channelsRef = useRef<Map<string, Tone.Channel>>(new Map());
  const delaysRef = useRef<Map<string, Tone.FeedbackDelay>>(new Map());
  const masterVolumeRef = useRef<Tone.Volume | null>(null);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());


  const initializeAudioNode = useCallback((track: Track, forceReload: boolean = false) => {
    let player = playersRef.current.get(track.id);
    let channel = channelsRef.current.get(track.id);
    let delay = delaysRef.current.get(track.id);

    if (!masterVolumeRef.current) {
      masterVolumeRef.current = new Tone.Volume(Tone.gainToDb(0.75)).toDestination();
    }
    
    if (player && (forceReload || player.buffer.url !== track.currentUrl)) player.dispose();
    if (channel && forceReload) channel.dispose(); 
    if (delay && forceReload) delay.dispose();

    if (!playersRef.current.has(track.id) || forceReload || playersRef.current.get(track.id)?.buffer.url !== track.currentUrl) {
        player = new Tone.Player({ url: track.currentUrl, loop: track.loop }); // DO NOT .sync().start(0) here
        playersRef.current.set(track.id, player);
    } else {
        player = playersRef.current.get(track.id)!;
        player.loop = track.loop; 
    }
    
    if (!channelsRef.current.has(track.id) || forceReload) {
        channel = new Tone.Channel(Tone.gainToDb(track.volume), 0);
        channelsRef.current.set(track.id, channel);
    } else {
        channel = channelsRef.current.get(track.id)!;
        channel.volume.value = Tone.gainToDb(track.volume);
        channel.mute = track.isMuted;
    }

    if (!delaysRef.current.has(track.id) || forceReload) {
        delay = new Tone.FeedbackDelay({
            delayTime: track.delayTime,
            feedback: track.delayFeedback,
            wet: track.delayWet,
        });
        delaysRef.current.set(track.id, delay);
    } else {
        delay = delaysRef.current.get(track.id)!;
        delay.delayTime.value = track.delayTime;
        delay.feedback.value = track.delayFeedback;
        delay.wet.value = track.delayWet;
    }
    
    player.chain(channel, delay, masterVolumeRef.current);
    
    return { player, channel, delay };
  }, []);


  useEffect(() => {
    if (!isAudioContextStarted) return;
    
    setIsLoading(true);
    const loadPromises = tracks.map(track => {
      const { player } = initializeAudioNode(track, track.isCustom); 
      return player.loaded;
    });
    
    Promise.all(loadPromises)
      .then(() => {
        setIsLoading(false);
        if (tracks.some(t => t.isCustom && !t.originalUrl.startsWith('data:'))) { // Avoid toast for initial default tracks if they were somehow marked custom
            toast({ title: "Custom Track Loaded", description: "Your uploaded audio is ready in the mixer." });
        } else if (!tracks.some(t => t.isCustom)) { // Only toast if not a custom track load
            toast({ title: "Mixer Ready", description: "All tracks loaded." });
        }
      })
      .catch(error => {
        console.error("Error loading tracks:", error);
        toast({ title: "Loading Error", description: "Some tracks could not be loaded.", variant: "destructive" });
        setIsLoading(false);
      });

    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
      if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") Tone.Transport.stop();
      playersRef.current.forEach(p => p.dispose());
      channelsRef.current.forEach(c => c.dispose());
      delaysRef.current.forEach(d => d.dispose());
      playersRef.current.clear();
      channelsRef.current.clear();
      delaysRef.current.clear();
      if (masterVolumeRef.current) {
        masterVolumeRef.current.dispose();
        masterVolumeRef.current = null;
      }
    };
  }, [isAudioContextStarted, tracks, initializeAudioNode, toast]);


  const handleStartAudioContext = async () => {
    if (!isAudioContextStarted) {
      await Tone.start();
      Tone.Transport.bpm.value = 120; 
      setIsAudioContextStarted(true);
      // Reset to default tracks to ensure clean state if re-starting context
      // This also triggers the useEffect to load these tracks
      setTracks(getDefaultTracks()); 
      toast({ title: "Audio Context Started", description: "Mixer is now active." });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, trackId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newObjectUrl = URL.createObjectURL(file);
    
    const oldObjectUrl = objectUrlsRef.current.get(trackId);
    if (oldObjectUrl) {
      URL.revokeObjectURL(oldObjectUrl);
    }
    objectUrlsRef.current.set(trackId, newObjectUrl); 

    setTracks(prevTracks =>
      prevTracks.map(t => {
        if (t.id === trackId) {
          playersRef.current.get(t.id)?.stop();
          return { 
            ...t, 
            title: file.name, 
            currentUrl: newObjectUrl, 
            file: file, 
            isCustom: true,
            isPlaying: false 
          };
        }
        return t;
      })
    );
  };

 const handlePlayPauseTrack = (trackId: string) => {
    if (!isAudioContextStarted || isLoading) return;

    const player = playersRef.current.get(trackId);
    if (!player) return;

    // This action will be reflected in the 'tracks' state update,
    // which then triggers re-render.
    setTracks(prevTracks =>
      prevTracks.map(t => {
        if (t.id === trackId) {
          if (!t.isPlaying) {
            if (Tone.Transport.state !== "started") {
              Tone.Transport.start("+0.1"); // Start transport slightly in future
            }
            player.sync(); // Sync to transport
            player.start(undefined, 0); // Start at current/next transport tick, from offset 0 of the buffer
          } else {
            player.stop(); // Stops the player in sync with the transport
          }
          return { ...t, isPlaying: !t.isPlaying };
        }
        return t;
      })
    );
  };
  
  const handleStopTrack = (trackId: string) => {
    if (!isAudioContextStarted || isLoading) return;
    const player = playersRef.current.get(trackId);
    if (player) {
      player.stop();
    }
    setTracks(prevTracks => prevTracks.map(t => t.id === trackId ? { ...t, isPlaying: false } : t));
  };

  const updateTrackParam = (trackId: string, param: keyof Track, value: any) => {
    setTracks(prevTracks =>
      prevTracks.map(t => {
        if (t.id === trackId) {
          const updatedTrack = { ...t, [param]: value };
          const channel = channelsRef.current.get(t.id);
          const delayNode = delaysRef.current.get(t.id);
          const playerNode = playersRef.current.get(t.id);

          if (channel) {
            if (param === 'volume') channel.volume.value = Tone.gainToDb(value as number);
            if (param === 'isMuted') channel.mute = value as boolean;
          }
          if (delayNode) {
            if (param === 'delayWet') delayNode.wet.value = value as number;
            if (param === 'delayTime') delayNode.delayTime.value = value as number; 
            if (param === 'delayFeedback') delayNode.feedback.value = value as number;
          }
          if (playerNode && param === 'loop') {
            playerNode.loop = value as boolean;
          }
          return updatedTrack;
        }
        return t;
      })
    );
  };

  const handlePlayAll = () => {
    if (!isAudioContextStarted || isLoading) return;
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start("+0.1");
    }
    
    const updatedTracks = tracks.map(track => {
      const player = playersRef.current.get(track.id);
      if (player && !track.isPlaying) {
        player.sync();
        player.start(undefined, 0); 
      }
      return { ...track, isPlaying: true };
    });
    setTracks(updatedTracks);
  };

  const handleStopAll = () => {
    if (!isAudioContextStarted || isLoading) return;
    if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
        Tone.Transport.stop();
    }
    playersRef.current.forEach(player => player.stop()); // Ensure players are also explicitly stopped
    setTracks(prev => prev.map(t => ({ ...t, isPlaying: false })));
  };
  
  if (!isAudioContextStarted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Card className="max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>Activate Audio Mixer</CardTitle>
            <CardDescription>Click the button below to start the audio context and enable the mixer controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStartAudioContext} size="lg" className="w-full">
              <Zap className="mr-2 h-5 w-5" /> Start Audio Context
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 min-h-[300px]">
         <RefreshCw className="h-12 w-12 animate-spin text-primary" />
         <p className="text-lg text-muted-foreground">Loading audio tracks...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-0">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Master Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Button onClick={handlePlayAll} variant="default" disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" /> Play All
          </Button>
          <Button onClick={handleStopAll} variant="destructive" disabled={isLoading}>
            <StopCircle className="mr-2 h-4 w-4" /> Stop All
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map(track => (
          <Card key={track.id} className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-lg truncate" title={track.title}>{track.title}</CardTitle>
              <CardDescription className="text-xs truncate">{track.isCustom ? "Custom Audio" : track.originalUrl}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="space-y-2">
                <Label htmlFor={`upload-${track.id}`} className="flex items-center cursor-pointer text-sm text-primary hover:underline">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {track.isCustom ? "Change Custom Audio" : "Upload Custom Audio"}
                </Label>
                <Input 
                  id={`upload-${track.id}`}
                  type="file" 
                  accept="audio/*" 
                  className="text-xs"
                  onChange={(e) => handleFileUpload(e, track.id)} 
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button onClick={() => handlePlayPauseTrack(track.id)} variant="outline" size="icon" disabled={isLoading}>
                  {track.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                 <Button onClick={() => handleStopTrack(track.id)} variant="outline" size="icon" title="Stop this track" disabled={isLoading}>
                  <Square className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2 ml-auto">
                  <Label htmlFor={`mute-${track.id}`} className="text-sm">Mute</Label>
                  <Switch
                    id={`mute-${track.id}`}
                    checked={track.isMuted}
                    onCheckedChange={checked => updateTrackParam(track.id, 'isMuted', checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`volume-${track.id}`}>Volume</Label>
                <Slider
                  id={`volume-${track.id}`}
                  min={0} max={1} step={0.01}
                  value={[track.volume]}
                  onValueChange={([val]) => updateTrackParam(track.id, 'volume', val)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor={`loop-${track.id}`}>Loop</Label>
                 <Switch
                    id={`loop-${track.id}`}
                    checked={track.loop}
                    onCheckedChange={checked => updateTrackParam(track.id, 'loop', checked)}
                    disabled={isLoading}
                  />
              </div>

              <fieldset className="border p-3 rounded-md">
                <legend className="text-sm font-medium px-1">Delay Effect</legend>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor={`delayWet-${track.id}`}>Wetness (Mix)</Label>
                    <Slider
                      id={`delayWet-${track.id}`}
                      min={0} max={1} step={0.01}
                      value={[track.delayWet]}
                      onValueChange={([val]) => updateTrackParam(track.id, 'delayWet', val)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`delayTime-${track.id}`}>Time (0-1s)</Label>
                    <Slider
                      id={`delayTime-${track.id}`}
                      min={0} max={1} step={0.01} 
                      value={[track.delayTime]}
                      onValueChange={([val]) => updateTrackParam(track.id, 'delayTime', val)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`delayFeedback-${track.id}`}>Feedback</Label>
                    <Slider
                      id={`delayFeedback-${track.id}`}
                      min={0} max={0.95} step={0.01} 
                      value={[track.delayFeedback]}
                      onValueChange={([val]) => updateTrackParam(track.id, 'delayFeedback', val)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </fieldset>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
