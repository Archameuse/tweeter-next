import { Metadata } from "next";
import SettingsFeed from "./feed";

export const metadata: Metadata = {
  title: "Settings",
  description: "Edit your profile",
};

export default function Settings() {
  return <SettingsFeed />;
}
