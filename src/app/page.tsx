
import UserSongsList from '@/components/dashboard/UserSongsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, UploadCloud, Youtube } from 'lucide-react'; 
import Link from 'next/link';
import YouTubeMusicSearchPlayer from '@/components/youtube/YouTubeMusicSearchPlayer'; // New import

export default function HomePage() { // Changed function name to HomePage for clarity at root
  return (
    <div className="py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Music className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-headline">Your Music Dashboard</CardTitle>
          <CardDescription>Manage your uploaded songs, get AI-powered remix ideas, and explore YouTube Music.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/upload">
                <UploadCloud className="mr-2 h-5 w-5" /> Upload New Song
              </Link>
            </Button>
             <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/search">
                <Youtube className="mr-2 h-5 w-5 text-red-500" /> Search YouTube Music
              </Link>
            </Button>
        </CardContent>
      </Card>
      
      {/* YouTube Music Search and Player Integration */}
      <Card className="shadow-lg border-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Youtube className="mr-3 h-7 w-7 text-red-500" />
            Explore YouTube Music
          </CardTitle>
          <CardDescription>
            Search for songs on YouTube Music and play them directly here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YouTubeMusicSearchPlayer />
        </CardContent>
      </Card>
      
      <UserSongsList />
    </div>
  );
}
