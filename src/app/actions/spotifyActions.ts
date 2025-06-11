
"use server";

// Define a more specific type for the items returned by Spotify's top tracks endpoint.
interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: { images: { url: string }[] };
  uri: string;
  external_urls?: { spotify: string; }; // Added external Spotify URL
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrackItem[];
}

interface SpotifyUserResponse {
  id: string;
  display_name?: string;
}

interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
  uri: string;
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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  token: string,
  body?: Record<string, any>
): Promise<any> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if ((method === 'POST' || method === 'PUT') && body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers,
      method,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }));
      console.error('Spotify API Error:', errorData);
      const errorPayload: SpotifyErrorResponse = {
        error: {
            status: res.status,
            message: errorData?.error?.message || errorData.message || `Spotify API request failed with status ${res.status}`
        }
      };
      return errorPayload;
    }
     // For 201 Created responses with no content, or other successful no-content responses
    if (res.status === 201 || res.status === 204) {
        return { success: true, status: res.status };
    }
    return await res.json();
  } catch (e: any) {
    console.error('Network or other error fetching from Spotify API:', e);
    return { error: { status: 500, message: e.message || "Failed to connect to Spotify API." } };
  }
}

// Server Action to get the user's top tracks
export async function getMyTopTracksAction(token: string): Promise<SpotifyTopTracksResponse | SpotifyErrorResponse> {
  const response = await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=20', // Fetch up to 20 for better playlist
    'GET',
    token
  );

  if (response && response.error) {
    return response as SpotifyErrorResponse;
  }

  // Ensure items have external_urls populated if available from Spotify
  if (response && response.items) {
    response.items = response.items.map((item: any) => ({
      ...item,
      external_urls: item.external_urls || { spotify: '#' } // Provide a fallback if missing
    }));
  }

  return response as SpotifyTopTracksResponse;
}

// Server action to create a playlist and add tracks
export async function createPlaylistWithTracksAction(
  token: string,
  trackUris: string[]
): Promise<SpotifyPlaylistResponse | SpotifyErrorResponse> {
  if (!trackUris || trackUris.length === 0) {
    return { error: { status: 400, message: "No track URIs provided to create playlist." } };
  }
  if (trackUris.length > 100) {
     return { error: { status: 400, message: "Cannot add more than 100 tracks at a time to a playlist." } };
  }

  // 1. Get User ID
  const userResponse: SpotifyUserResponse | SpotifyErrorResponse = await fetchWebApi('v1/me', 'GET', token);
  if (userResponse && (userResponse as SpotifyErrorResponse).error) {
    return userResponse as SpotifyErrorResponse;
  }
  const userId = (userResponse as SpotifyUserResponse).id;

  // 2. Create Playlist
  const playlistPayload = {
    name: "My Echo Canvas Top Tracks",
    description: `Top tracks curated by Echo Canvas on ${new Date().toLocaleDateString()}.`,
    public: false, // Make it private by default
  };
  const playlistResponse: SpotifyPlaylistResponse | SpotifyErrorResponse = await fetchWebApi(
    `v1/users/${userId}/playlists`,
    'POST',
    token,
    playlistPayload
  );

  if (playlistResponse && (playlistResponse as SpotifyErrorResponse).error) {
    return playlistResponse as SpotifyErrorResponse;
  }
  const newPlaylist = playlistResponse as SpotifyPlaylistResponse;

  // 3. Add Tracks to Playlist
  // Spotify API expects track URIs in the request body for adding items.
  const addTracksPayload = {
    uris: trackUris,
  };
  const addTracksResponse = await fetchWebApi(
    `v1/playlists/${newPlaylist.id}/tracks`,
    'POST',
    token,
    addTracksPayload
  );

  if (addTracksResponse && (addTracksResponse as SpotifyErrorResponse).error) {
    // Even if adding tracks fails, the playlist was created. We could choose to return the playlist
    // and an error message about tracks, or just the error. For now, prioritize the error.
    console.warn(`Playlist ${newPlaylist.id} created, but failed to add tracks:`, (addTracksResponse as SpotifyErrorResponse).error.message);
    return {
      error: {
        status: (addTracksResponse as SpotifyErrorResponse).error.status,
        message: `Playlist '${newPlaylist.name}' created, but failed to add tracks: ${(addTracksResponse as SpotifyErrorResponse).error.message}`
      }
    };
  }

  return newPlaylist;
}
