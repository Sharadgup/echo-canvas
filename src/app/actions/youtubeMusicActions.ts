
"use server";

import type { SongCardProps } from "@/components/playlist/SongCard"; // Assuming SongCardProps is exported or create a similar type

export interface YouTubeMusicSearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  youtubeVideoUrl: string; // URL to the YouTube video/music
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
    return [
      { id: "mockYtId1", title: "Mock YouTube Song 1", artist: "Mock Artist YT", thumbnailUrl: `https://placehold.co/300x300.png?text=YT+Song+1`, youtubeVideoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm + " Mock YouTube Song 1")}` },
      { id: "mockYtId2", title: "Mock YouTube Song 2", artist: "Another Mock Artist YT", thumbnailUrl: `https://placehold.co/300x300.png?text=YT+Song+2`, youtubeVideoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm + " Mock YouTube Song 2")}` },
    ];
  }

  // IMPORTANT: Replace with the actual API endpoint and query parameters
  const endpoint = `/search?query=${encodeURIComponent(searchTerm)}`; // Example endpoint
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
        id: item.id?.videoId || String(Math.random()), // Ensure an ID exists
        title: item.snippet?.title || "Unknown Title",
        artist: item.snippet?.channelTitle || "Unknown Artist",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        youtubeVideoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      })).slice(0, 10); // Limit results for now
    }
    return []; // Return empty if data format is unexpected
  } catch (error) {
    console.error("Error calling YouTube Music API:", error);
    // In case of error, you could return mock data or re-throw
    // For now, returning empty array on error after attempting fetch
    return [];
  }
}
