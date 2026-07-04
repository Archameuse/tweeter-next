import type { Metadata } from "next";
import { Noto_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@teispace/next-themes";
import PostModal from "@/components/post/postModal";
import { UserProvider } from "@/providers/UserProvider";
import { COOKIE_NAME, fetchMe } from "@/utils/userHelpers";
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
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  const initialUser = await fetchMe(cookie);
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${notoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background min-h-full flex flex-col font-poppins font-medium overflow-x-hidden">
        <ThemeProvider>
          <UserProvider initialUser={initialUser}>
            <Header />
            {children}
            <PostModal />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
