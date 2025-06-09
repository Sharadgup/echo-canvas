"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Music, User, LogIn, LogOut, Search as SearchIcon, ListMusic, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const { user, loading, isUserProcessing, setIsUserProcessing } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  const handleLogout = async () => {
    setIsUserProcessing(true);
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    } finally {
      setIsUserProcessing(false);
      setIsSheetOpen(false);
    }
  };

  const navLinks = [
    { href: '/playlist', label: 'Playlist', icon: ListMusic },
    { href: '/visualizer', label: 'Visualizer', icon: GitBranch },
    { href: '/search', label: 'Search', icon: SearchIcon },
  ];

  const NavContent = ({ mobile }: { mobile?: boolean }) => (
    <>
      {navLinks.map((link) => (
        <Button key={link.href} variant="ghost" asChild onClick={() => mobile && setIsSheetOpen(false)}>
          <Link href={link.href} className="flex items-center gap-2">
            <link.icon className="h-4 w-4" /> {link.label}
          </Link>
        </Button>
      ))}
      {user ? (
        <>
          <Button variant="ghost" asChild onClick={() => mobile && setIsSheetOpen(false)}>
            <Link href="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleLogout} disabled={isUserProcessing} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild onClick={() => mobile && setIsSheetOpen(false)}>
            <Link href="/login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          </Button>
          <Button variant="default" asChild onClick={() => mobile && setIsSheetOpen(false)}>
            <Link href="/signup" className="flex items-center gap-2">
              Sign Up
            </Link>
          </Button>
        </>
      )}
    </>
  );


  if (loading) return null; // Or a loading skeleton for header

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-2xl">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Music className="h-6 w-6" />
          <span className="font-headline">Echo Canvas</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-2">
          <NavContent />
        </div>

        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 pt-6">
                <NavContent mobile />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
