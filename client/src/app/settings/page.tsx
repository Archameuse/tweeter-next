import { Metadata } from "next";
import SettingsFeed from "./feed";
import { fetchUser } from "@/utils/userHelpers";
import { getServerCookie } from "@/utils/serverUserHelpers";

export const metadata: Metadata = {
  title: "Settings",
  description: "Edit your profile",
};

export default async function Settings() {
  const { error, data: userSettings } = await fetchUser<UserSettings>(
    "/users?scope=settings",
    { cookie: await getServerCookie() },
  );
  if (error) console.error(error);
  if (!userSettings) return null;
  return <SettingsFeed userSettings={userSettings} />;
}
