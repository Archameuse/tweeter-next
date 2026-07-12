import { Metadata } from "next";
import UserFeed from "./feed";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchUser } from "@/utils/userHelpers";
import { getServerCookie } from "@/utils/serverUserHelpers";

type Props = {
  params: Promise<{ id: string }>;
};
// const profile: Profile = {
//   id: "1",
//   username: "cyber_wanderer",
//   avatar: "/temp/ (12).jpg",
//   followed: true,
//   banner: "/temp/ (31).jpg",
//   status: "Exploring the digital wilderness. 🌐",
//   followers: 1420,
//   following: 620,
// };
const getProfile = cache(async (id: string) => {
  const { data, error } = await fetchUser<Profile>(
    `/users?scope=profile&id=${id}`,
    {
      cookie: await getServerCookie(),
    },
  );
  if (error) console.error(error);
  return data;
});

// export const metadata: Metadata = {
//   title: profile.username,
//   description: "See user profile of " + profile.username,
// };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile)
    return {
      title: "Error",
    };
  return {
    title: profile.username,
    description: "See user profile of " + profile.username,
  };
}

export default async function User({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();
  const profile = await getProfile(id);
  if (!profile) notFound();
  return <UserFeed initialProfile={profile} />;
}
