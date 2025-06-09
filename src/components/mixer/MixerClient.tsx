
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
  originalUrl: string; 
  currentUrl: string; 
  file?: File;
  isCustom?: boolean;
  isPlaying: boolean;
  volume: number; 
  delayWet: number; 
  delayTime: number; 
  delayFeedback: number; 
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
    loop: t.title.includes('Loop'), 
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


  useEffect(() => {
    if (!isAudioContextStarted) return;

    setIsLoading(true);
    const activeTrackIds = new Set<string>();

    const loadPromises = tracks.map(track => {
        activeTrackIds.add(track.id);

        let player = playersRef.current.get(track.id);
        let channel = channelsRef.current.get(track.id);
        let delay = delaysRef.current.get(track.id);
        let playerRecreated = false;

        if (!masterVolumeRef.current) {
            masterVolumeRef.current = new Tone.Volume(Tone.gainToDb(0.75)).toDestination();
        }

        // Determine if player needs full recreation
        // Condition: No player exists, or existing player is loaded and its buffer URL is different from current track URL.
        if (!player || (player.loaded && player.buffer && player.buffer.url !== track.currentUrl)) {
            player?.dispose(); // Dispose old player if it exists and URL changed
            player = new Tone.Player({ url: track.currentUrl, loop: track.loop });
            playersRef.current.set(track.id, player);
            playerRecreated = true;
        } else if (player) {
             // Player exists and URL is the same (or not loaded yet, will load currentUrl), update loop
            player.loop = track.loop;
        }
        
        // If player was recreated, or channel/delay don't exist, they also need recreation.
        if (playerRecreated || !channel) {
            channel?.dispose();
            channel = new Tone.Channel(Tone.gainToDb(track.volume), 0); // pan = 0
            channelsRef.current.set(track.id, channel);
        }
        channel.volume.value = Tone.gainToDb(track.volume); // Always update
        channel.mute = track.isMuted; // Always update

        if (playerRecreated || !delay) {
            delay?.dispose();
            delay = new Tone.FeedbackDelay({
                delayTime: track.delayTime,
                feedback: track.delayFeedback,
                wet: track.delayWet,
            });
            delaysRef.current.set(track.id, delay);
        }
        delay.delayTime.value = track.delayTime; // Always update
        delay.feedback.value = track.delayFeedback; // Always update
        delay.wet.value = track.delayWet; // Always update
        
        // Always re-chain. Player.chain disconnects previous outputs.
        player.chain(channel, delay, masterVolumeRef.current);
        
        return player.loaded;
    });

    // Cleanup nodes for tracks that might have been removed (if applicable in future)
    playersRef.current.forEach((_, id) => {
        if (!activeTrackIds.has(id)) {
            playersRef.current.get(id)?.dispose();
            playersRef.current.delete(id);
            channelsRef.current.get(id)?.dispose();
            channelsRef.current.delete(id);
            delaysRef.current.get(id)?.dispose();
            delaysRef.current.delete(id);
        }
    });
    
    Promise.all(loadPromises)
      .then(() => {
        setIsLoading(false);
        if (tracks.some(t => t.isCustom && !t.originalUrl.startsWith('data:'))) {
            toast({ title: "Custom Track Loaded", description: "Your uploaded audio is ready in the mixer." });
        } else if (!tracks.some(t => t.isCustom)) { 
            toast({ title: "Mixer Ready", description: "All tracks loaded." });
        }
      })
      .catch(error => {
        console.error("Error loading tracks:", error);
        toast({ title: "Loading Error", description: "Some tracks could not be loaded.", variant: "destructive" });
        setIsLoading(false);
      });

    return () => {
      // Component unmount cleanup
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
      if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
          Tone.Transport.stop();
      }
      playersRef.current.forEach(p => {
        if (p.state === "started") p.stop();
        p.dispose();
      });
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
  }, [isAudioContextStarted, tracks, toast]);


  const handleStartAudioContext = async () => {
    if (!isAudioContextStarted) {
      await Tone.start();
      Tone.Transport.bpm.value = 120; 
      setIsAudioContextStarted(true);
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
          playersRef.current.get(t.id)?.stop(); // Stop current playback before changing source
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
    if (!player || !player.loaded) {
        toast({ title: "Track not ready", description: "Please wait for the track to load.", variant: "default"});
        return;
    }

    setTracks(prevTracks =>
      prevTracks.map(t => {
        if (t.id === trackId) {
          if (!t.isPlaying) {
            if (Tone.Transport.state !== "started") {
              Tone.Transport.start("+0.1"); 
            }
            player.sync(); 
            player.start(undefined, 0); 
          } else {
            player.stop(); 
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
          // Tone.js node updates are handled by the main useEffect reacting to 'tracks' state change
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
      if (player && player.loaded && !track.isPlaying) {
        player.sync();
        player.start(undefined, 0); 
        return { ...track, isPlaying: true };
      }
      return track; // Keep isPlaying true if already playing
    });
    setTracks(updatedTracks);
  };

  const handleStopAll = () => {
    if (!isAudioContextStarted || isLoading) return;
    if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
        Tone.Transport.stop(); // This will stop all synced players
    }
    // Explicitly stop to ensure, though transport.stop() should handle synced players.
    playersRef.current.forEach(player => player.stop()); 
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
                <Button onClick={() => handlePlayPauseTrack(track.id)} variant="outline" size="icon" disabled={isLoading || (!playersRef.current.get(track.id)?.loaded && !track.isPlaying) }>
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

