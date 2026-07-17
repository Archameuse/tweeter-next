import type { Metadata } from "next";
import { Noto_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import PostModal from "@/components/post/postModal";
import { fetchMe } from "@/utils/userHelpers";
import { Providers } from "@/providers/providers";
import { getServerCookie } from "@/utils/serverUserHelpers";
import PostReplyModal from "@/components/post/postReplyModal";
import PostRepliesModal from "@/components/post/postRepliesModal";
import FollowsModal from "@/components/modals/followsModal";
import { cookies } from "next/headers";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  preload: true,
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: {
    template: "Tweeter - %s",
    default: "Tweeter",
  },
  description: "devchallenges.io challenge",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await cookies();
  const serverCookie = await getServerCookie();
  const initialUser = await fetchMe(serverCookie);

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${notoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background min-h-full flex flex-col font-poppins font-medium overflow-x-hidden">
        <Providers initialUser={initialUser}>
          <Header />
          {children}
          <PostModal />
          <PostReplyModal />
          <PostRepliesModal />
          <FollowsModal />
        </Providers>
      </body>
    </html>
  );
}
