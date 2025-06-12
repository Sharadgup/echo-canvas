
import { NextResponse, type NextRequest } from 'next/server';
import { db, addDoc, collection, serverTimestamp } from '@/lib/firebase'; 

export async function POST(request: NextRequest) {
  if (!db) {
    console.error('Firestore (db) is not initialized. This is likely due to missing or invalid Firebase environment variables. Check server logs for details.');
    return NextResponse.json(
      { error: 'Server configuration error: Unable to connect to database. Please check server logs or contact support if this persists.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { title, artist, audioUrl, userId } = body;

    if (!title || !audioUrl || !userId) {
      return NextResponse.json({ error: 'Missing required fields (title, audioUrl, userId)' }, { status: 400 });
    }

    const songData = {
      userId,
      title,
      artist: artist || 'Unknown Artist',
      audioUrl,
      uploadedAt: serverTimestamp(),
      // Add any other metadata you want to store
    };

    const docRef = await addDoc(collection(db, 'songs'), songData);

    return NextResponse.json({ message: 'Song metadata saved successfully', songId: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving song metadata:', error);
    // Check for specific Firebase errors if needed, e.g., permission denied
    if (error.code === 'permission-denied') {
        return NextResponse.json({ error: 'Permission denied to save song metadata.', details: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to save song metadata', details: error.message }, { status: 500 });
  }
}
