import { Metadata } from "next";
import SignInFeed from "./feed";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign into your account or create new",
};

export default function SignIn() {
  return <SignInFeed />;
}
