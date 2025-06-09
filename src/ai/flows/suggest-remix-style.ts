
'use server';
/**
 * @fileOverview A Genkit flow to suggest remix styles for a given song.
 *
 * - suggestRemixStyle - A function that suggests remix styles.
 * - SongDetailsSchema - The input type for the suggestRemixStyle function.
 * - RemixSuggestionSchema - The return type for the suggestRemixStyle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SongDetailsSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().optional().describe('The artist of the song (optional).'),
  currentStyle: z.string().optional().describe('The current musical style or genre of the song (optional).'),
});
export type SongDetails = z.infer<typeof SongDetailsSchema>;

export const RemixSuggestionSchema = z.object({
  suggestedStyle: z.string().describe('The new musical style suggested for the remix (e.g., Lo-fi, Deep House, Synthwave).'),
  ideas: z.array(z.string()).describe('A list of 2-3 specific creative ideas for implementing the remix in the suggested style.'),
  reasoning: z.string().describe('A brief explanation of why this style and these ideas would be a good fit for the original song.'),
});
export type RemixSuggestion = z.infer<typeof RemixSuggestionSchema>;

export async function suggestRemixStyle(input: SongDetails): Promise<RemixSuggestion> {
  return suggestRemixStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRemixStylePrompt',
  input: { schema: SongDetailsSchema },
  output: { schema: RemixSuggestionSchema },
  prompt: `You are a highly creative and knowledgeable music producer AI.
Your task is to suggest an innovative remix style for a given song.

Song Details:
Title: {{{title}}}
{{#if artist}}Artist: {{{artist}}}{{/if}}
{{#if currentStyle}}Current Style/Genre: {{{currentStyle}}}{{/if}}

Based on these details (even if some are missing, use your general music knowledge), please provide:
1.  A 'suggestedStyle': A new, interesting musical style for a remix. Be specific (e.g., "Chillwave Trap Remix", "Acoustic Folk Version", "Progressive Trance").
2.  'ideas': An array of 2 to 3 distinct, actionable creative ideas for how this remix could be approached. For example, specific instruments to add, tempo changes, vocal effects, structural rearrangements, or mood shifts.
3.  'reasoning': A concise explanation (1-2 sentences) of why the suggested style and ideas would be a compelling transformation for the original song.

Focus on creativity and providing genuinely useful starting points for a producer.
Ensure the output is in the specified JSON format.`,
  config: {
    safetySettings: [ // Add default safety settings
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  }
});

const suggestRemixStyleFlow = ai.defineFlow(
  {
    name: 'suggestRemixStyleFlow',
    inputSchema: SongDetailsSchema,
    outputSchema: RemixSuggestionSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a suggestion.');
    }
    return output;
  }
);
