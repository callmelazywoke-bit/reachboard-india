import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReachBoard India — Verified Instagram Creator Leaderboard',
  description:
    'India\u2019s verified Instagram creator leaderboard, media kit generator, and brand pitch platform. Claim your rank, generate story cards, and connect with brands.',
  openGraph: {
    title: 'ReachBoard India',
    description: 'India\u2019s verified Instagram creator leaderboard and brand pitch platform.',
    images: [{ url: '/api/og/story' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReachBoard India',
    description: 'India\u2019s verified Instagram creator leaderboard and brand pitch platform.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0B0F17] text-white antialiased`}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
