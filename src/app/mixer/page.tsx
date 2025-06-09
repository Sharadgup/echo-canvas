import MixerClient from "@/components/mixer/MixerClient";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";

export default function MixerPage() {
  return (
    <div className="py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl mb-8">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl flex items-center justify-center">
            <SlidersHorizontal className="mr-3 h-8 w-8 text-primary" />
            Multitrack Mixer
          </CardTitle>
          <CardDescription>
            Control multiple audio tracks simultaneously. Adjust volume, delay, and more.
          </CardDescription>
        </CardHeader>
      </Card>
      <MixerClient />
    </div>
  );
}
