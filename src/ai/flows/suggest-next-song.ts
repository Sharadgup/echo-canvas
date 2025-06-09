'use server';

/**
 * @fileOverview A flow for suggesting the next song in a playlist based on listening history and the current song.
 *
 * - suggestNextSong - A function that suggests the next song.
 * - SuggestNextSongInput - The input type for the suggestNextSong function.
 * - SuggestNextSongOutput - The return type for the suggestNextSong function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextSongInputSchema = z.object({
  listeningHistory: z.array(
    z.string().describe('The title of a song in the user listening history.')
  ).describe('The user listening history, as a list of song titles.'),
  currentSong: z.string().describe('The title of the song currently playing.'),
});
export type SuggestNextSongInput = z.infer<typeof SuggestNextSongInputSchema>;

const SuggestNextSongOutputSchema = z.object({
  nextSong: z.string().describe('The suggested next song to play.'),
  reason: z.string().describe('The reason why this song was suggested.'),
});
export type SuggestNextSongOutput = z.infer<typeof SuggestNextSongOutputSchema>;

export async function suggestNextSong(input: SuggestNextSongInput): Promise<SuggestNextSongOutput> {
  return suggestNextSongFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextSongPrompt',
  input: {schema: SuggestNextSongInputSchema},
  output: {schema: SuggestNextSongOutputSchema},
  prompt: `You are a music expert. Given a user's listening history and the current song,
  suggest the next song that the user might enjoy. Explain your reasoning.

  Listening History:
  {{#each listeningHistory}}
  - {{this}}
  {{/each}}

  Current Song: {{currentSong}}

  Suggest the next song and explain why it fits the user's taste.`,
});

const suggestNextSongFlow = ai.defineFlow(
  {
    name: 'suggestNextSongFlow',
    inputSchema: SuggestNextSongInputSchema,
    outputSchema: SuggestNextSongOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
