"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateInitialPlaylist, GenerateInitialPlaylistInput } from "@/ai/flows/generate-initial-playlist";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2 } from "lucide-react";

const formSchema = z.object({
  musicTastePrompt: z.string().min(10, { message: "Please describe your music taste in at least 10 characters." }),
});

interface PlaylistGeneratorClientProps {
  onPlaylistGenerated: (playlist: string[]) => void;
}

export default function PlaylistGeneratorClient({ onPlaylistGenerated }: PlaylistGeneratorClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      musicTastePrompt: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const input: GenerateInitialPlaylistInput = { musicTastePrompt: values.musicTastePrompt };
      const result = await generateInitialPlaylist(input);
      onPlaylistGenerated(result.playlist);
      toast({ title: "Playlist Generated!", description: "Your personalized playlist is ready." });
      form.reset();
    } catch (error) {
      console.error("Error generating playlist:", error);
      toast({ title: "Error", description: "Could not generate playlist. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Wand2 className="mr-2 h-6 w-6 text-primary" />
          Create Your Soundscape
        </CardTitle>
        <CardDescription>Tell us about your music preferences, and we'll craft a playlist just for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="musicTastePrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your music taste</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Upbeat electronic for coding, melancholic indie folk for rainy days, 90s hip-hop classics..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Playlist"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
