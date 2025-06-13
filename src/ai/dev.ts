
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-next-song.ts';
import '@/ai/flows/generate-initial-playlist.ts';
import '@/ai/flows/suggest-remix-style.ts';
import '@/ai/flows/analyze-audio-for-search-flow.ts'; // Added new flow
