
"use server";

import { suggestRemixStyle, type SongDetails, type RemixSuggestion } from "@/ai/flows/suggest-remix-style";

export interface ActionError {
  error: true;
  message: string;
  details?: any;
}

export async function suggestRemixStyleAction(input: SongDetails): Promise<RemixSuggestion | ActionError> {
  try {
    const suggestion = await suggestRemixStyle(input);
    return suggestion;
  } catch (error: any) {
    console.error("Error in suggestRemixStyleAction:", error);
    return {
      error: true,
      message: error.message || "Failed to get AI remix suggestion.",
      details: error.toString(),
    };
  }
}

