import type { Metadata } from 'next';
import { Figtree, Newsreader } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MealMeow - Cat Food Recommendations',
  description:
    'Get personalized cat food recommendations based on your cat\'s age, weight, and health goals. Science-backed nutrition calculations.',
  keywords: ['cat food', 'cat nutrition', 'pet food recommendations', 'cat diet'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
