
"use server";

export interface YouTubeMusicSearchResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  youtubeVideoUrl: string;
}

// Interface based on the documented response for youtube-music4.p.rapidapi.com /search
interface YoutubeMusicApiItem {
  type: string; // "video", "playlist", "channel", "artist"
  videoId?: string;
  name: string; // Song title
  artist?: {
    name: string;
    artistId?: string;
  };
  album?: {
    name: string;
    albumId?: string;
  };
  duration?: {
    totalSeconds: number;
    label: string;
  };
  thumbnails: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  isExplicit?: boolean;
  // Other fields might exist for different types like playlist or artist
  playlistId?: string; 
  browseId?: string; // For artists/channels
}


export async function searchYoutubeMusicAction(searchTerm: string): Promise<YouTubeMusicSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  const apiHost = process.env.NEXT_PUBLIC_RAPIDAPI_HOST;

  if (!apiKey || !apiHost || apiHost === "YOUR_RAPIDAPI_HOST_HERE" || apiHost !== "youtube-music4.p.rapidapi.com") {
    console.warn("RapidAPI Key or Host is not configured correctly for youtube-music4.p.rapidapi.com. Returning mock data for YouTube Music search.");
    // Return mock data if API details are not fully configured
    return [
      { videoId: "dQw4w9WgXcQ", title: "Never Gonna Give You Up (Mock)", artist: "Rick Astley (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` },
      { videoId: "kJQP7kiw5Fk", title: "Bohemian Rhapsody (Mock)", artist: "Queen (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=kJQP7kiw5Fk` },
      { videoId: "3tmd-ClpJxA", title: "Blinding Lights (Mock)", artist: "The Weeknd (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/3tmd-ClpJxA/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=3tmd-ClpJxA` },
    ];
  }

  const endpoint = `/search?query=${encodeURIComponent(searchTerm)}`; 
  const url = `https://${apiHost}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET", // youtube-music4 /search is a GET request
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

    // The youtube-music4.p.rapidapi.com /search endpoint returns an array directly
    const data: YoutubeMusicApiItem[] = await response.json();

    if (Array.isArray(data)) {
      return data
        .filter(item => item.type === 'video' && item.videoId) // Ensure we only process video types with a videoId
        .map((item: YoutubeMusicApiItem) => ({
          videoId: item.videoId!,
          title: item.name || "Unknown Title",
          artist: item.artist?.name || "Unknown Artist",
          thumbnailUrl: item.thumbnails?.find(t => t.height >= 90)?.url || item.thumbnails?.[0]?.url, // Get a decent quality thumbnail
          youtubeVideoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
        }))
        .slice(0, 10); // Limit results
    }
    console.warn("YouTube Music API response format unexpected (expected an array). Data:", data);
    return [];
  } catch (error) {
    console.error("Error calling YouTube Music API:", error);
    return [];
  }
}

