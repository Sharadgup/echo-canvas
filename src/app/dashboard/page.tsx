
import UserSongsList from '@/components/dashboard/UserSongsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, UploadCloud, RadioTower, Search } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Music className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-headline">Your Music Dashboard</CardTitle>
          <CardDescription>Manage your uploaded songs, get AI-powered remix ideas, and connect to Spotify.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/upload">
                <UploadCloud className="mr-2 h-5 w-5" /> Upload New Song
              </Link>
            </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-accent">
        <CardHeader>
          <div className="flex flex-col items-center text-center">
            <RadioTower className="mx-auto h-10 w-10 text-accent mb-3" />
            <CardTitle className="text-2xl font-headline text-accent">Connect with Spotify</CardTitle>
            <CardDescription>Discover your top tracks, create new playlists on Spotify, and more.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Head over to our Search & Spotify page to link your account and explore your listening habits.
          </p>
          <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent/10 hover:text-accent">
            <Link href="/search">
              <Search className="mr-2 h-5 w-5" /> Manage Spotify Tracks
            </Link>
          </Button>
        </CardContent>
      </Card>
      
      <UserSongsList />
    </div>
  );
}
