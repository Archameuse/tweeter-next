import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@teispace/next-themes";
import PostModal from "@/components/post/postModal";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  preload: true,
});

export const metadata: Metadata = {
  title: {
    template: "Tweeter - %s",
    default: "Tweeter",
  },
  description: "devchallenges.io challenge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background min-h-full flex flex-col font-poppins font-medium overflow-x-hidden">
        <ThemeProvider>
          <Header />
          {children}
          <PostModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
