
'use server';
/**
 * @fileOverview A Genkit flow to analyze an audio clip and generate a search query.
 *
 * - analyzeAudioForSearch - A function that analyzes audio and suggests a search query.
 * - AnalyzeAudioInput - The input type for the analyzeAudioForSearch function.
 * - AnalyzeAudioOutput - The return type for the analyzeAudioForSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio clip as a data URI that must include a MIME type (e.g., 'audio/webm' or 'audio/ogg') and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeAudioInput = z.infer<typeof AnalyzeAudioInputSchema>;

const AnalyzeAudioOutputSchema = z.object({
  searchQuery: z.string().describe('A concise search query suitable for finding similar content on YouTube Music, based on the audio analysis.'),
  analysisNotes: z.string().describe('A brief description of the identified sound or voice, including genre, instruments, mood, or keywords if speech is detected.'),
});
export type AnalyzeAudioOutput = z.infer<typeof AnalyzeAudioOutputSchema>;

export async function analyzeAudioForSearch(input: AnalyzeAudioInput): Promise<AnalyzeAudioOutput> {
  return analyzeAudioForSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAudioForSearchPrompt',
  input: { schema: AnalyzeAudioInputSchema },
  output: { schema: AnalyzeAudioOutputSchema },
  prompt: `You are an expert audio analyst AI. Your task is to analyze the provided audio clip and generate a suitable YouTube Music search query.

Audio Clip: {{media url=audioDataUri}}

Instructions:
1.  Listen to the audio clip carefully.
2.  In 'analysisNotes', provide a brief description of what you hear. For music, mention genre, key instruments, tempo, mood (e.g., "Upbeat electronic dance track with prominent synth and heavy bass", "Slow acoustic folk song with male vocals and fingerpicked guitar", "Sound of rain and thunder"). For speech, briefly describe the voice or topic if discernible. If it's a specific sound, describe it (e.g., "Dog barking", "Car horn").
3.  Based on your analysis, formulate a concise 'searchQuery' that would be effective for finding this sound, song, or similar content on YouTube Music. The query should be something a user would type into a search bar.

Examples for 'searchQuery':
- If audio is a pop song: "Taylor Swift new single" or "upbeat pop music"
- If audio is a cat meowing: "cat meowing sound effect"
- If audio is someone talking about "Firebase": "Firebase tutorial"

Focus on extracting the most salient features for a good search experience.
Ensure the output is in the specified JSON format.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  }
});

const analyzeAudioForSearchFlow = ai.defineFlow(
  {
    name: 'analyzeAudioForSearchFlow',
    inputSchema: AnalyzeAudioInputSchema,
    outputSchema: AnalyzeAudioOutputSchema,
  },
  async (input) => {
    // Note: The effectiveness of this depends on the model's capability to process audio data URIs.
    // Gemini 1.5 Pro or models with explicit audio support would be ideal.
    // The current `gemini-2.0-flash` might have limitations here.
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to analyze audio or generate a search query.');
    }
    return output;
  }
);
