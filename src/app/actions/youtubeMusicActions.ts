
"use server";

export interface YouTubeMusicSearchResult {
  videoId: string;
  title: string;
  artist: string; // Will be mapped from channelTitle
  thumbnailUrl?: string;
  youtubeVideoUrl: string;
}

interface YouTubeDataApiItemSnippetThumbnails {
  default: { url: string; width: number; height: number };
  medium: { url: string; width: number; height: number };
  high: { url: string; width: number; height: number };
}

interface YouTubeDataApiItemSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeDataApiItemSnippetThumbnails;
  channelTitle: string; // This will be used as artist
  liveBroadcastContent: string;
  publishTime: string;
}

interface YouTubeDataApiItemId {
  kind: string;
  videoId: string;
}

interface YouTubeDataApiItem {
  kind: string;
  etag: string;
  id: YouTubeDataApiItemId;
  snippet: YouTubeDataApiItemSnippet;
}

interface YouTubeDataApiResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeDataApiItem[];
}


export async function searchYoutubeMusicAction(searchTerm: string): Promise<YouTubeMusicSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY_HERE") {
    console.warn("YouTube Data API Key is not configured correctly. Returning mock data for YouTube Music search.");
    // Return mock data if API details are not fully configured
    return [
      { videoId: "dQw4w9WgXcQ", title: "Never Gonna Give You Up (Mock YT Data API)", artist: "Rick Astley (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` },
      { videoId: "kJQP7kiw5Fk", title: "Bohemian Rhapsody (Mock YT Data API)", artist: "Queen (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=kJQP7kiw5Fk` },
      { videoId: "3tmd-ClpJxA", title: "Blinding Lights (Mock YT Data API)", artist: "The Weeknd (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/3tmd-ClpJxA/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=3tmd-ClpJxA` },
    ];
  }

  const baseUrl = "https://www.googleapis.com/youtube/v3/search";
  const params = new URLSearchParams({
    part: "snippet",
    q: searchTerm,
    type: "video",
    videoCategoryId: "10", // Category ID for "Music"
    topicId: "/m/04rlf", // Freebase Topic ID for Music, to further refine results
    key: apiKey,
    maxResults: "10",
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`YouTube Data API Error (${response.status}):`, errorBody);
      throw new Error(`Failed to fetch from YouTube Data API: ${errorBody.error?.message || response.statusText}`);
    }

    const data: YouTubeDataApiResponse = await response.json();

    if (data.items && Array.isArray(data.items)) {
      return data.items
        .filter(item => item.id?.videoId && item.snippet?.title && item.snippet?.channelTitle) // Basic validation
        .map((item: YouTubeDataApiItem) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle, // Using channelTitle as artist
          thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          youtubeVideoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));
    }
    console.warn("YouTube Data API response format unexpected. Data:", data);
    return [];
  } catch (error) {
    console.error("Error calling YouTube Data API:", error);
    return []; // Return empty array on error, or re-throw as needed
  }
}

