"use client";

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto py-8 px-4 md:px-6 text-center text-muted-foreground">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Echo Canvas. All rights reserved.
        </p>
        <p className="text-xs mt-2">
          Built with Next.js, Tailwind CSS, and Firebase.
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <Link href="/privacy" className="text-xs hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-xs hover:text-primary transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
