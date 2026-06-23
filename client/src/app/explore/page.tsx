import { Metadata } from "next";
import ExploreFeed from "./feed";

export const metadata: Metadata = {
  title: "Explore",
  description: "Explore new tweets",
};

export default function Explore() {
  return <ExploreFeed />;
}
