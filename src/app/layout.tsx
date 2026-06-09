import type { Metadata } from 'next';
import { JetBrains_Mono, Outfit } from 'next/font/google';

import { Toaster } from '@/components/ui/Sonner';
import { PostHogProvider, QueryProvider } from '@/providers';

import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <QueryProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
