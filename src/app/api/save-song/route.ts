
import { NextResponse, type NextRequest } from 'next/server';
import { db, addDoc, collection, serverTimestamp } from '@/lib/firebase'; // Assuming auth is handled by client sending userId

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Failed to save song metadata', details: error.message }, { status: 500 });
  }
}
