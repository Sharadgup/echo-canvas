// @ts-nocheck
"use client";

import * as Tone from 'tone';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, StopCircle, Volume2, VolumeX, RefreshCw, Zap, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  url: string;
  isPlaying: boolean;
  volume: number; // 0-1 for UI
  delayWet: number; // 0-1 for UI
  delayTime: number; // 0-1 for UI (maps to 0-1 seconds)
  delayFeedback: number; // 0-1 for UI
  isMuted: boolean;
  loop: boolean;
}

const initialTracks: Track[] = [
  { id: 'track1', title: 'Ominous Loop', url: 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/drum-samples/loops/ominous.mp3', isPlaying: false, volume: 0.75, delayWet: 0, delayTime: 0.2, delayFeedback: 0.3, isMuted: false, loop: true },
  { id: 'track2', title: 'Casio Synth', url: 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/casio/C2.mp3', isPlaying: false, volume: 0.75, delayWet: 0, delayTime: 0.2, delayFeedback: 0.3, isMuted: false, loop: false },
  { id: 'track3', title: 'Kick Drum', url: 'https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/drum-samples/Loops/gabba.mp3', isPlaying: false, volume: 0.75, delayWet: 0.1, delayTime: 0.3, delayFeedback: 0.4, isMuted: false, loop: true },
];

export default function MixerClient() {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const channelsRef = useRef<Map<string, Tone.Channel>>(new Map());
  const delaysRef = useRef<Map<string, Tone.FeedbackDelay>>(new Map());
  const masterVolumeRef = useRef<Tone.Volume | null>(null);

  const initializeAudioNode = useCallback((track: Track) => {
    let player = playersRef.current.get(track.id);
    let channel = channelsRef.current.get(track.id);
    let delay = delaysRef.current.get(track.id);

    if (!masterVolumeRef.current) {
      masterVolumeRef.current = new Tone.Volume(Tone.gainToDb(0.75)).toDestination();
    }
    
    if (player) player.dispose();
    if (channel) channel.dispose();
    if (delay) delay.dispose();

    player = new Tone.Player({ url: track.url, loop: track.loop }).sync().start(0);
    channel = new Tone.Channel(Tone.gainToDb(track.volume), 0); // pan is 0 (center)
    channel.mute = track.isMuted;
    delay = new Tone.FeedbackDelay({
      delayTime: track.delayTime, // Assuming this is 0-1 mapped to 0-1s
      feedback: track.delayFeedback,
      wet: track.delayWet,
    });

    player.chain(channel, delay, masterVolumeRef.current);

    playersRef.current.set(track.id, player);
    channelsRef.current.set(track.id, channel);
    delaysRef.current.set(track.id, delay);
    
    return { player, channel, delay };
  }, []);


  useEffect(() => {
    if (!isAudioContextStarted || !Tone.Transport.started) return;

    const loadPromises = tracks.map(track => {
      const {player, channel, delay} = initializeAudioNode(track);
      return player.loaded;
    });
    
    Promise.all(loadPromises)
      .then(() => {
        setIsLoading(false);
        toast({ title: "Mixer Ready", description: "All tracks loaded." });
      })
      .catch(error => {
        console.error("Error loading tracks:", error);
        toast({ title: "Loading Error", description: "Some tracks could not be loaded.", variant: "destructive" });
        setIsLoading(false);
      });

    return () => {
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
      Tone.Transport.bpm.value = 120; // Default BPM
      setIsAudioContextStarted(true);
      toast({ title: "Audio Context Started", description: "Mixer is now active." });
    }
  };

  const handlePlayPauseTrack = (trackId: string) => {
    if (!isAudioContextStarted || isLoading) return;
    setTracks(prevTracks =>
      prevTracks.map(t => {
        if (t.id === trackId) {
          const player = playersRef.current.get(t.id);
          if (player) {
            if (!t.isPlaying) {
               if (Tone.Transport.state !== "started") Tone.Transport.start();
               player.start();
            } else {
               player.stop();
            }
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
            if (param === 'delayTime') delayNode.delayTime.value = value as number; // Max 1s
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
    if (Tone.Transport.state !== "started") Tone.Transport.start();
    tracks.forEach(track => {
      const player = playersRef.current.get(track.id);
      if (player && !track.isPlaying) player.start();
    });
    setTracks(prev => prev.map(t => ({ ...t, isPlaying: true })));
  };

  const handleStopAll = () => {
    if (!isAudioContextStarted || isLoading) return;
    Tone.Transport.stop(); // This stops all synced players
    tracks.forEach(track => {
        const player = playersRef.current.get(track.id);
        if (player) player.stop(); // Ensure each player is explicitly stopped as well
    });
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
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
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
          <Button onClick={handlePlayAll} variant="default">
            <Play className="mr-2 h-4 w-4" /> Play All
          </Button>
          <Button onClick={handleStopAll} variant="destructive">
            <StopCircle className="mr-2 h-4 w-4" /> Stop All
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map(track => (
          <Card key={track.id} className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-lg">{track.title}</CardTitle>
              <CardDescription className="text-xs truncate">{track.url}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="flex items-center space-x-2">
                <Button onClick={() => handlePlayPauseTrack(track.id)} variant="outline" size="icon">
                  {track.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                 <Button onClick={() => handleStopTrack(track.id)} variant="outline" size="icon" title="Stop this track">
                  <Square className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2 ml-auto">
                  <Label htmlFor={`mute-${track.id}`} className="text-sm">Mute</Label>
                  <Switch
                    id={`mute-${track.id}`}
                    checked={track.isMuted}
                    onCheckedChange={checked => updateTrackParam(track.id, 'isMuted', checked)}
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
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor={`loop-${track.id}`}>Loop</Label>
                 <Switch
                    id={`loop-${track.id}`}
                    checked={track.loop}
                    onCheckedChange={checked => updateTrackParam(track.id, 'loop', checked)}
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
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`delayTime-${track.id}`}>Time (0-1s)</Label>
                    <Slider
                      id={`delayTime-${track.id}`}
                      min={0} max={1} step={0.01} // Maps to 0-1 seconds
                      value={[track.delayTime]}
                      onValueChange={([val]) => updateTrackParam(track.id, 'delayTime', val)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`delayFeedback-${track.id}`}>Feedback</Label>
                    <Slider
                      id={`delayFeedback-${track.id}`}
                      min={0} max={0.95} step={0.01} // Feedback > 1 can be too much
                      value={[track.delayFeedback]}
                      onValueChange={([val]) => updateTrackParam(track.id, 'delayFeedback', val)}
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
