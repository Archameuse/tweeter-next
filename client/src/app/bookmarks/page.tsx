import { Metadata } from "next";
import BookmarksFeed from "./feed";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "View your bookmarks",
};

export default function Bookmarks() {
  return <BookmarksFeed />;
}
