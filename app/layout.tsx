import type { Metadata } from 'next';
import './globals.css';
import { CaptionStyleProvider } from '@/components/caption-style-provider';

export const metadata: Metadata = {
  title: 'Caption App',
  description: 'AI-powered video caption generator for fast, polished captions.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CaptionStyleProvider>{children}</CaptionStyleProvider>
      </body>
    </html>
  );
}
