import { Metadata } from "next";
import UserFeed from "./feed";

const profile: Profile = {
  id: 123,
  username: "cyber_wanderer",
  image: "/temp/ (12).jpg",
  followed: true,
  banner: "/temp/ (31).jpg",
  status: "Exploring the digital wilderness. 🌐",
  followers: 1420,
  following: 620,
};
export const metadata: Metadata = {
  title: profile.username,
  description: "Explore new tweets",
};

export default function User() {
  return <UserFeed profile={profile} />;
}
