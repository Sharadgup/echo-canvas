
"use server";

export interface YouTubeMusicSearchResult {
  videoId: string;
  title: string;
  artist: string;
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
  channelTitle: string; 
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

  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY_HERE") {
    console.warn("YouTube Data API Key is not configured correctly. Returning mock data for YouTube Music search.");
    // Simulate pagination for mock data
    const mockResultsBase = [
      { videoId: "dQw4w9WgXcQ", title: "Never Gonna Give You Up (Mock YT Data API)", artist: "Rick Astley (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` },
      { videoId: "kJQP7kiw5Fk", title: "Bohemian Rhapsody (Mock YT Data API)", artist: "Queen (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=kJQP7kiw5Fk` },
      { videoId: "3tmd-ClpJxA", title: "Blinding Lights (Mock YT Data API)", artist: "The Weeknd (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/3tmd-ClpJxA/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=3tmd-ClpJxA` },
      { videoId: "U4WZGOFcn2w", title: "As It Was (Mock YT Data API)", artist: "Harry Styles (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/U4WZGOFcn2w/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=U4WZGOFcn2w` },
      { videoId: "papj40Kk49w", title: "Levitating (Mock YT Data API)", artist: "Dua Lipa (Mock YT)", thumbnailUrl: `https://i.ytimg.com/vi/papj40Kk49w/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=papj40Kk49w` },
    ];
    if (pageToken === "mock_page_2") {
        return { 
            results: [
                 { videoId: "VIDEO_ID_MOCK_6", title: "Mock Song 6", artist: "Mock Artist 6", thumbnailUrl: `https://i.ytimg.com/vi/VIDEO_ID_MOCK_6/mqdefault.jpg`, youtubeVideoUrl: `https://www.youtube.com/watch?v=VIDEO_ID_MOCK_6` },
            ], 
            nextPageToken: undefined 
        }; // No more mock pages
    }
    return { results: mockResultsBase.slice(0, 3), nextPageToken: "mock_page_2" };
  }

  const baseUrl = "https://www.googleapis.com/youtube/v3/search";
  const params = new URLSearchParams({
    part: "snippet",
    q: searchTerm,
    type: "video",
    videoCategoryId: "10", 
    topicId: "/m/04rlf", 
    key: apiKey,
    maxResults: "9", // Fetch 9 to allow for a 3x3 grid display per page
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
          .filter(item => item.id?.videoId && item.snippet?.title && item.snippet?.channelTitle) 
          .map((item: YouTubeDataApiItem) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle, 
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            youtubeVideoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          }))
      : [];
    
    return { results, nextPageToken: data.nextPageToken };

  } catch (error) {
    console.error("Error calling YouTube Data API:", error);
    return { results: [], nextPageToken: undefined }; 
  }
}
