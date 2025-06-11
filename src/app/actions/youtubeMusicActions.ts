
"use server";

export interface YouTubeMusicSearchResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  youtubeVideoUrl: string;
}

// Interfaces for YouTube Data API v3 Response
interface YouTubeDataApiThumbnails {
  default: { url: string; width: number; height: number };
  medium: { url: string; width: number; height: number };
  high: { url: string; width: number; height: number };
}

interface YouTubeDataApiItemSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeDataApiThumbnails;
  channelTitle: string; 
  liveBroadcastContent: string;
  publishTime: string;
}

interface YouTubeDataApiItemId {
  kind: string;
  videoId: string;
}

interface YouTubeDataApiItem {
  kind: "youtube#searchResult"; // This is typically the kind for search results
  etag: string;
  id: YouTubeDataApiItemId;
  snippet: YouTubeDataApiItemSnippet;
}

interface YouTubeDataApiResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string; 
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeDataApiItem[];
}

export interface YouTubeMusicSearchResponse {
  results: YouTubeMusicSearchResult[];
  nextPageToken?: string;
}


export async function searchYoutubeMusicAction(
  searchTerm: string, 
  pageToken?: string
): Promise<YouTubeMusicSearchResponse> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY_HERE" || apiKey.includes("YOUR_FIREBASE")) { // Added check for placeholder firebase key too
    console.warn("YouTube Data API Key is not configured correctly. Returning mock data for YouTube Music search.");
    // Simulate pagination for mock data
    const mockResultsPage1 = [
      { videoId: "dQw4w9WgXcQ", title: "Never Gonna Give You Up (Mock YT)", artist: "Rick Astley (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` },
      { videoId: "kJQP7kiw5Fk", title: "Bohemian Rhapsody (Mock YT)", artist: "Queen (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=kJQP7kiw5Fk` },
      { videoId: "3tmd-ClpJxA", title: "Blinding Lights (Mock YT)", artist: "The Weeknd (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/3tmd-ClpJxA/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=3tmd-ClpJxA` },
    ];
    const mockResultsPage2 = [
      { videoId: "U4WZGOFcn2w", title: "As It Was (Mock YT - Page 2)", artist: "Harry Styles (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/U4WZGOFcn2w/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=U4WZGOFcn2w` },
      { videoId: "papj40Kk49w", title: "Levitating (Mock YT - Page 2)", artist: "Dua Lipa (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/papj40Kk49w/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=papj40Kk49w` },
    ];

    if (pageToken === "mock_next_page_token") {
        return { results: mockResultsPage2, nextPageToken: undefined }; // No more mock pages after page 2
    }
    return { results: mockResultsPage1, nextPageToken: "mock_next_page_token" };
  }

  const baseUrl = "https://www.googleapis.com/youtube/v3/search";
  const params = new URLSearchParams({
    part: "snippet",
    q: searchTerm,
    type: "video",
    videoCategoryId: "10", // Music category
    topicId: "/m/04rlf", // Music topic
    key: apiKey,
    maxResults: "9", 
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

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

    const results: YouTubeMusicSearchResult[] = (data.items && Array.isArray(data.items))
      ? data.items
          .filter(item => item.id?.videoId && item.snippet?.title && item.snippet?.channelTitle && item.kind === "youtube#searchResult") 
          .map((item: YouTubeDataApiItem) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle, 
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            youtubeVideoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          }))
      : [];
    
    return { results, nextPageToken: data.nextPageToken };

  } catch (error) {
    console.error("Error calling YouTube Data API:", error);
    // In case of error, return empty results and no token to prevent further calls
    return { results: [], nextPageToken: undefined }; 
  }
}
