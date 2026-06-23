import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  preload: true,
});

export const metadata: Metadata = {
  title: {
    template: 'Tweeter - %s',
    default: 'Tweeter',
  },
  description: 'devchallenges.io challenge',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

{
  /* <style>
[data-mode="dark"] {
  color-scheme: dark;
}
[data-mode="light"] {
  color-scheme:light;
}
</style> */
}
