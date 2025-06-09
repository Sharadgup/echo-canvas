
import UserSongsList from '@/components/dashboard/UserSongsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Music className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-headline">Your Music Dashboard</CardTitle>
          <CardDescription>Manage your uploaded songs and get AI-powered remix ideas.</CardDescription>
        </CardHeader>
      </Card>
      <UserSongsList />
    </div>
  );
}
