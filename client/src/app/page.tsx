import { Metadata } from "next";
import HomeFeed from "./feed";

export const metadata: Metadata = {
  description: "View your feed",
};

export default function Home() {
  return <HomeFeed />;
}
