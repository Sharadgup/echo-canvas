
"use server";

import { db, collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from '@/lib/firebase';
import type { User } from 'firebase/auth'; // For user type if needed elsewhere

export interface LikedSong {
  id?: string; // Firestore document ID, optional as it's not present before adding
  userId: string;
  songId: string; // YouTube videoId or custom ID for uploaded songs
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  source: 'youtube' | 'uploaded'; // To distinguish origin
  youtubeVideoUrl?: string; // Only if source is 'youtube'
  likedAt: Timestamp | Date;
}

export interface ToggleLikeSongInput {
  userId: string;
  songId: string;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  source: 'youtube' | 'uploaded';
  youtubeVideoUrl?: string;
}

// Action to toggle like status (add if not liked, remove if liked)
export async function toggleLikeSongAction(input: ToggleLikeSongInput): Promise<{ liked: boolean; songId: string }> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check server configuration.");
  }
  if (!input.userId || !input.songId || !input.title || !input.source) {
    throw new Error("Missing required fields for liking a song.");
  }

  const likedSongsRef = collection(db, 'userLikedSongs');
  const q = query(likedSongsRef, where('userId', '==', input.userId), where('songId', '==', input.songId), where('source', '==', input.source));
  
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Song is not liked, so add it
    const newLikedSong: Omit<LikedSong, 'id' | 'likedAt'> & { likedAt: any } = {
      userId: input.userId,
      songId: input.songId,
      title: input.title,
      artist: input.artist,
      thumbnailUrl: input.thumbnailUrl,
      source: input.source,
      youtubeVideoUrl: input.source === 'youtube' ? input.youtubeVideoUrl : undefined,
      likedAt: serverTimestamp(),
    };
    await addDoc(likedSongsRef, newLikedSong);
    return { liked: true, songId: input.songId };
  } else {
    // Song is already liked, so remove it
    // Assuming only one document per user-song-source combination
    const docToDelete = querySnapshot.docs[0];
    await deleteDoc(doc(db, 'userLikedSongs', docToDelete.id));
    return { liked: false, songId: input.songId };
  }
}

// Action to get all liked songs for a user
export async function getLikedSongsAction(userId: string): Promise<LikedSong[]> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check server configuration.");
  }
  if (!userId) {
    // console.warn("getLikedSongsAction called without userId. Returning empty array.");
    return [];
  }

  const likedSongsRef = collection(db, 'userLikedSongs');
  const q = query(likedSongsRef, where('userId', '==', userId));
  
  const querySnapshot = await getDocs(q);
  const songs = querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      songId: data.songId,
      title: data.title,
      artist: data.artist,
      thumbnailUrl: data.thumbnailUrl,
      source: data.source,
      youtubeVideoUrl: data.youtubeVideoUrl,
      // Ensure likedAt is converted to Date if it's a Firestore Timestamp
      likedAt: data.likedAt instanceof Timestamp ? data.likedAt.toDate() : new Date(data.likedAt),
    } as LikedSong;
  });

  // Sort by likedAt, newest first
  songs.sort((a, b) => (b.likedAt as Date).getTime() - (a.likedAt as Date).getTime());
  
  return songs;
}

// Action to check if a specific song (by songId and source) is liked by a user
export async function isSongLikedAction(userId: string, songId: string, source: 'youtube' | 'uploaded'): Promise<boolean> {
  if (!db || !userId || !songId || !source) {
    return false;
  }
  const likedSongsRef = collection(db, 'userLikedSongs');
  const q = query(likedSongsRef, where('userId', '==', userId), where('songId', '==', songId), where('source', '==', source));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Action to get a list of liked song IDs for a user (useful for initial UI state)
export async function getLikedSongIdsAction(userId: string, source: 'youtube' | 'uploaded' | 'all' = 'all'): Promise<string[]> {
  if (!db || !userId) {
    return [];
  }
  const likedSongsRef = collection(db, 'userLikedSongs');
  let q;
  if (source === 'all') {
    q = query(likedSongsRef, where('userId', '==', userId));
  } else {
    q = query(likedSongsRef, where('userId', '==', userId), where('source', '==', source));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => docSnap.data().songId as string);
}
