'use server';

/**
 * @fileOverview A flow to generate an initial playlist for a new user based on their music taste.
 *
 * - generateInitialPlaylist - A function that generates an initial playlist.
 * - GenerateInitialPlaylistInput - The input type for the generateInitialPlaylist function.
 * - GenerateInitialPlaylistOutput - The return type for the generateInitialPlaylist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialPlaylistInputSchema = z.object({
  musicTastePrompt: z
    .string()
    .describe('A description of the user music taste.'),
});

export type GenerateInitialPlaylistInput = z.infer<
  typeof GenerateInitialPlaylistInputSchema
>;

const GenerateInitialPlaylistOutputSchema = z.object({
  playlist: z
    .array(z.string())
    .describe('A list of songs that fit the user taste.'),
});

export type GenerateInitialPlaylistOutput = z.infer<
  typeof GenerateInitialPlaylistOutputSchema
>;

export async function generateInitialPlaylist(
  input: GenerateInitialPlaylistInput
): Promise<GenerateInitialPlaylistOutput> {
  return generateInitialPlaylistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialPlaylistPrompt',
  input: {schema: GenerateInitialPlaylistInputSchema},
  output: {schema: GenerateInitialPlaylistOutputSchema},
  prompt: `You are a music expert. A new user is using our application and has the following music taste: {{{musicTastePrompt}}}. Generate a list of songs for them. Return the list of songs as a JSON array of strings.`,
});

const generateInitialPlaylistFlow = ai.defineFlow(
  {
    name: 'generateInitialPlaylistFlow',
    inputSchema: GenerateInitialPlaylistInputSchema,
    outputSchema: GenerateInitialPlaylistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
