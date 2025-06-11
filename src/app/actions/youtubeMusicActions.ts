
"use server";

// Assuming SongCardProps is exported or create a similar type

export interface YouTubeMusicSearchResult {
  videoId: string; // Essential for embedding
  title: string;
  artist: string;
  thumbnailUrl?: string;
  youtubeVideoUrl: string; // URL to the YouTube video/music (full watch URL)
}

interface YoutubeMusicApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle?: string; // Artist might be here or in a different field
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  // Add other fields based on the actual API response
}


export async function searchYoutubeMusicAction(searchTerm: string): Promise<YouTubeMusicSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  const apiHost = process.env.NEXT_PUBLIC_RAPIDAPI_HOST;

  if (!apiKey || !apiHost || apiHost === "YOUR_RAPIDAPI_HOST_HERE") {
    console.warn("RapidAPI Key or Host is not configured. Returning mock data for YouTube Music search.");
    // Return mock data if API details are not fully configured
    // Ensure mock data includes videoId
    return [
      { videoId: "dQw4w9WgXcQ", title: "Never Gonna Give You Up (Mock)", artist: "Rick Astley (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` },
      { videoId: "kJQP7kiw5Fk", title: "Bohemian Rhapsody (Mock)", artist: "Queen (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=kJQP7kiw5Fk` },
    ];
  }

  // IMPORTANT: Replace with the actual API endpoint and query parameters if different
  const endpoint = `/search?query=${encodeURIComponent(searchTerm)}`; 
  const url = `https://${apiHost}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": apiHost,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`RapidAPI Error (${response.status}): ${errorBody}`);
      throw new Error(`Failed to fetch from YouTube Music API: ${response.statusText}`);
    }

    const data = await response.json();

    // IMPORTANT: Adapt this mapping based on the actual structure of your RapidAPI response
    // This is a common structure for YouTube search APIs but might differ.
    if (data && data.items && Array.isArray(data.items)) {
      return data.items.map((item: YoutubeMusicApiItem) => ({
        videoId: item.id?.videoId || String(Math.random().toString(36).substring(7)), // Ensure a videoId exists
        title: item.snippet?.title || "Unknown Title",
        artist: item.snippet?.channelTitle || "Unknown Artist",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        youtubeVideoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      })).slice(0, 10); // Limit results for now
    }
    console.warn("YouTube Music API response format unexpected, returning empty array. Data:", data);
    return []; // Return empty if data format is unexpected
  } catch (error) {
    console.error("Error calling YouTube Music API:", error);
    // In case of error, you could return mock data or re-throw
    // For now, returning empty array on error after attempting fetch
    return [];
  }
}
