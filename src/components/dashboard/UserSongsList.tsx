
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db, collection, query, where, getDocs, Timestamp } from '@/lib/firebase';
import TrackCardDashboard from './TrackCardDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, AlertTriangle, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  uploadedAt: Timestamp | Date; // Firestore Timestamp or converted Date
}

export default function UserSongsList() {
  const { user, loading: authLoading } = useAuthContext();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSongs = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setSongs([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'songs'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const userSongs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          artist: data.artist,
          audioUrl: data.audioUrl,
          uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
        } as Song;
      });
      // Sort by upload date, newest first
      userSongs.sort((a, b) => (b.uploadedAt as Date).getTime() - (a.uploadedAt as Date).getTime());
      setSongs(userSongs);
    } catch (err: any) {
      console.error("Error fetching songs:", err);
      setError("Failed to load your songs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSongs();
    }
  }, [authLoading, user, fetchSongs]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your music library...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert className="max-w-xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Please <Link href="/login?redirect=/dashboard" className="font-semibold text-primary hover:underline">log in</Link> to view your dashboard and uploaded songs.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Songs</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/upload">
            <UploadCloud className="mr-2 h-5 w-5" /> Upload New Song
          </Link>
        </Button>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <p className="text-xl font-semibold text-muted-foreground">Your music library is empty.</p>
          <p className="text-sm text-muted-foreground">Upload some songs to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {songs.map(song => (
            <TrackCardDashboard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}
