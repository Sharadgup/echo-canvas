
"use server";

// Define a more specific type for the items returned by Spotify's top tracks endpoint.
interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: { images: { url: string }[] }; // Album and images can be optional
  // Add other fields if needed, e.g., external_urls, preview_url
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrackItem[];
  // Include other fields from the response if necessary, like 'total', 'limit', 'offset', 'href'
}

interface SpotifyErrorResponse {
    error: {
        status: number;
        message: string;
    }
}

// Helper function to make requests to the Spotify Web API
async function fetchWebApi(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE', // Limit method to common HTTP verbs
  token: string,
  body?: Record<string, any> // Optional body for POST/PUT requests
): Promise<any> { // It's better to type this more specifically if possible, but 'any' for now
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (method !== 'GET' && body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers,
      method,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      // Attempt to parse error response from Spotify
      const errorData = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }));
      console.error('Spotify API Error:', errorData);
      // Construct a consistent error object to return or throw
      const errorPayload: SpotifyErrorResponse = { 
        error: { 
            status: res.status, 
            message: errorData?.error?.message || errorData.message || `Spotify API request failed with status ${res.status}`
        } 
      };
      return errorPayload;
    }
    return await res.json();
  } catch (e: any) {
    console.error('Network or other error fetching from Spotify API:', e);
    // Construct a consistent error object for network errors
    return { error: { status: 500, message: e.message || "Failed to connect to Spotify API." } };
  }
}

// Server Action to get the user's top tracks
export async function getMyTopTracksAction(token: string): Promise<SpotifyTopTracksResponse | SpotifyErrorResponse> {
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  // Fetches more items to give a better selection, up to 20.
  const response = await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=20',
    'GET',
    token
  );
  
  // Check if the response indicates an error (as structured by fetchWebApi)
  if (response && response.error) {
    return response as SpotifyErrorResponse;
  }

  return response as SpotifyTopTracksResponse;
}

    