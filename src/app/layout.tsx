import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
