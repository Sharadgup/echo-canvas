
"use server";

// Helper function to remove SRT/VTT timestamps and other metadata
// and split text into lines.
function cleanAndSplitCaptionText(text: string): string[] {
  // Remove timestamps (e.g., 00:00:00,000 --> 00:00:02,000 or [00:00:00.000])
  let cleaned = text.replace(/(\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}|\[\d{2}:\d{2}:\d{2}\.\d{3}\])/g, '');
  // Remove VTT specific tags and cues like <v Roger>, <c.color>, kind:, align:, position: etc.
  cleaned = cleaned.replace(/<v\s+[^>]+>/gi, ''); // Matches <v Author Name>
  cleaned = cleaned.replace(/<\/v>/gi, '');
  cleaned = cleaned.replace(/<c[.\w\s"=#\-%:]*>/gi, ''); // Matches <c> or <c.classname> or <c.colorDFDFDF>
  cleaned = cleaned.replace(/<\/c>/gi, '');
  cleaned = cleaned.replace(/align:\s*\w+/gi, '');
  cleaned = cleaned.replace(/position:\s*[\d.]+%?/gi, '');
  cleaned = cleaned.replace(/size:\s*[\d.]+%?/gi, '');
  cleaned = cleaned.replace(/line:\s*[\d.]+%?/gi, '');
  
  // Remove WEBVTT header, Kind, Language, Style, Region lines
  cleaned = cleaned.replace(/^WEBVTT\s*(- .*?)?\s*$/im, '');
  cleaned = cleaned.replace(/^Kind:\s*\w+\s*$/im, '');
  cleaned = cleaned.replace(/^Language:\s*[\w-]+\s*$/im, '');
  cleaned = cleaned.replace(/^STYLE\s*$[\s\S]*?^$/im, ''); // Remove multiline STYLE blocks
  cleaned = cleaned.replace(/^REGION\s*$[\s\S]*?^$/im, ''); // Remove multiline REGION blocks
  cleaned = cleaned.replace(/^NOTE\s*$[\s\S]*?^$/im, ''); // Remove multiline NOTE blocks

  // Remove sequence numbers (lines that are just numbers)
  cleaned = cleaned.replace(/^\d+\s*$/gm, '');
  
  // Normalize newlines and remove extra blank lines
  cleaned = cleaned.replace(/\r\n/g, '\n');
  const lines = cleaned.split('\n');
  
  // Filter out empty lines and lines that were just metadata
  return lines.map(line => line.trim()).filter(line => line !== "" && !line.match(/^NOTE(\s.*)?$/i));
}


interface YouTubeCaptionTrack {
  id: string;
  language: string;
  name: string;
  vssId: string; // e.g., ".en" or "a.en"
  isTranslatable: boolean;
}

interface YouTubeCaptionListResponse {
  captionTracks?: YouTubeCaptionTrack[];
}

export async function fetchYouTubeVideoCaptionsAction(videoId: string): Promise<string[] | null> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey || apiKey === "YOUR_YOUTUBE_API_KEY_HERE" || apiKey.includes("YOUR_FIREBASE")) {
    console.warn("YouTube Data API Key is not configured correctly for captions. Returning mock captions.");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return [
        "This is a mock lyric line one,",
        "From our placeholder system, have some fun.",
        "If you see this, your API key might be undone,",
        "Or captions for this video are none.",
        "(Music playing...)",
        "Yeah, this is how we mock the flow,",
        "Line by line, watch the lyrics grow."
    ];
  }

  const listCaptionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;

  try {
    const listResponse = await fetch(listCaptionsUrl);
    if (!listResponse.ok) {
      const errorData = await listResponse.json();
      console.error("Error fetching caption list:", errorData.error?.message || listResponse.statusText);
      if (listResponse.status === 403 && errorData.error?.errors?.[0]?.reason === 'captionsDisabled') {
        console.log(`Captions are disabled for video: ${videoId}`);
        return null; // Captions explicitly disabled
      }
      if (listResponse.status === 404) {
         console.log(`No caption tracks found for video (404): ${videoId}`);
         return null; 
      }
      // For other errors, we might still throw or return null
      // throw new Error(`Failed to list captions: ${errorData.error?.message || listResponse.statusText}`);
      return null;
    }

    const listData: YouTubeCaptionListResponse = await listResponse.json();

    if (!listData.captionTracks || listData.captionTracks.length === 0) {
      console.log(`No caption tracks found for video: ${videoId}`);
      return null;
    }

    // Prefer English, then first available.
    // vssId can be like ".en", "a.en", ".fr-CA", etc.
    let targetTrack = listData.captionTracks.find(track => track.vssId.includes('.en') || track.snippet?.language === 'en');
    if (!targetTrack) {
      targetTrack = listData.captionTracks[0];
    }
    
    if (!targetTrack) {
        console.log(`Could not determine a target caption track for video: ${videoId}`);
        return null;
    }

    // Fetch the actual caption track content using targetTrack.id
    // The YouTube API documentation suggests using the vssId or language to specify format,
    // but the actual download often goes to a youtube.com URL.
    // The `tfmt` parameter can request specific formats like 'srt' or 'vtt'.
    const downloadUrl = `https://www.googleapis.com/youtube/v3/captions/${targetTrack.id}?key=${apiKey}&tfmt=vtt`;
    
    const captionResponse = await fetch(downloadUrl);
    if (!captionResponse.ok) {
      const errorData = await captionResponse.text(); // Error might not be JSON
      console.error("Error downloading caption track:", errorData);
      throw new Error(`Failed to download caption track: ${captionResponse.statusText}`);
    }

    const rawCaptionText = await captionResponse.text();
    const captionLines = cleanAndSplitCaptionText(rawCaptionText);

    if (captionLines.length === 0) {
        console.log(`Cleaned captions resulted in no lines for video: ${videoId}`);
        return null;
    }

    return captionLines;

  } catch (error: any) {
    console.error("Error in fetchYouTubeVideoCaptionsAction:", error);
    // Return null or throw, depending on desired error handling for the UI
    return null; 
  }
}

    