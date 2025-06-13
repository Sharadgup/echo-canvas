
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Added SheetHeader, SheetTitle
import { Menu, Music, User, LogIn, LogOut, Search as SearchIcon, SlidersHorizontal, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Header() {
  const { user, loading, isUserProcessing, setIsUserProcessing } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/search', label: 'Search', icon: SearchIcon },
    { href: '/mixer', label: 'Mixer', icon: SlidersHorizontal },
  ];

  const ThemeToggleButton = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Button
      variant="ghost"
      size={isMobile ? "default" : "icon"}
      onClick={() => {
        toggleTheme();
        if (isMobile) setIsSheetOpen(false);
      }}
      aria-label="Toggle theme"
      className={isMobile ? "w-full justify-start gap-2" : ""}
    >
      {theme === 'dark' ? <Sun className={isMobile ? "h-4 w-4" : "h-5 w-5"} /> : <Moon className={isMobile ? "h-4 w-4" : "h-5 w-5"} />}
      {isMobile && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
    </Button>
  );

  const NavContent = ({ mobile }: { mobile?: boolean }) => (
    <>
      {navLinks.map((link) => (
        <Button key={link.href} variant="ghost" asChild onClick={() => mobile && setIsSheetOpen(false)} className={mobile ? "w-full justify-start" : ""}>
          <Link href={link.href} className="flex items-center gap-2">
            <link.icon className="h-4 w-4" /> {link.label}
          </Link>
        </Button>
      ))}
      {user ? (
        <>
          <Button variant="ghost" asChild onClick={() => mobile && setIsSheetOpen(false)} className={mobile ? "w-full justify-start" : ""}>
            <Link href="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleLogout} disabled={isUserProcessing} className={`flex items-center gap-2 ${mobile ? "w-full justify-start" : ""}`}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild onClick={() => mobile && setIsSheetOpen(false)} className={mobile ? "w-full justify-start" : ""}>
            <Link href="/login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          </Button>
          <Button variant="default" asChild onClick={() => mobile && setIsSheetOpen(false)} className={mobile ? "w-full justify-start" : ""}>
            <Link href="/signup" className="flex items-center gap-2">
              Sign Up
            </Link>
          </Button>
        </>
      )}
      <ThemeToggleButton isMobile={mobile} />
    </>
  );


  if (loading) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-2xl">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Music className="h-6 w-6" />
          <span className="font-headline">Echo Canvas</span>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
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
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-2 mt-4">
                <NavContent mobile />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
