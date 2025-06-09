
"use server";

import { suggestRemixStyle, type SongDetails, type RemixSuggestion } from "@/ai/flows/suggest-remix-style";

export async function suggestRemixStyleAction(input: SongDetails): Promise<RemixSuggestion> {
  try {
    const suggestion = await suggestRemixStyle(input);
    return suggestion;
  } catch (error) {
    console.error("Error in suggestRemixStyleAction:", error);
    // You might want to throw a more specific error or return a structured error object
    throw new Error("Failed to get AI remix suggestion.");
  }
}
