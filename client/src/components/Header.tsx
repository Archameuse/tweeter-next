"use client";

import { useState } from "react";
import { ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "./ui/userAvatar";
import { ActionButton } from "./ui/actionButton";
import { useUser } from "@/providers/UserProvider";
import getUsername from "@/utils/getUsername";

export function Header() {
  const [expanded, setExpanded] = useState(false);
  // const [user, setUser] = useState(true);
  const { user, logout } = useUser();
  const route = usePathname();
  const { theme, setTheme } = useTheme();

  const isHome = route === "/";
  const isExplore = route === "/explore";
  const isBookmarks = route === "/bookmarks";
  const isSettings = route === "/settings";

  const signOut = async () => {
    await logout();
  };

  return (
    <nav
      onPointerDown={() => setExpanded(false)}
      className="bg-white select-none dark:bg-primaryBlack w-full h-16 flex justify-evenly items-center gap-4 relative"
    >
      <Link
        href={user ? "/" : "/explore"}
        className="h-8 w-32 min-w-8 relative"
      >
        <span className="sr-only">Tweeter logo</span>
        <Image
          alt={user ? "Go to explore" : "Tweeter logo"}
          src="/tweeter-small.svg"
          className="md:hidden"
          width={41}
          height={30}
        />
        <Image
          alt={user ? "Go to explore" : "Tweeter logo"}
          src="/tweeter.svg"
          className="hidden dark:hidden md:block"
          width={126}
          height={30}
          loading="eager"
          preload
        />
        <Image
          alt={user ? "Go to explore" : "Tweeter logo"}
          src="/tweeter-light.svg"
          className="hidden md:dark:block"
          width={126}
          height={30}
        />
      </Link>
      <ul
        id="navbar"
        className="hidden sm:flex items-center justify-evenly h-full w-full max-w-80 gap-4"
      >
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="cursor-pointer text-primaryGray dark:text-white"
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
          <span className="sr-only">Toggle theme</span>
        </button>
        {user && (
          <>
            <HeaderButton href="/" active={isHome}>
              Home
            </HeaderButton>
            <HeaderButton href="/explore" active={isExplore}>
              Explore
            </HeaderButton>
            <HeaderButton href="/bookmarks" active={isBookmarks}>
              Bookmarks
            </HeaderButton>
          </>
        )}
      </ul>
      <div className="min-w-32 h-full flex items-center justify-center relative group">
        {user ? (
          <>
            <HeaderProfile user={user} />
            <div className="absolute z-30 top-full w-full h-0 overflow-clip group-hover:h-20 flex flex-col bg-white dark:bg-primaryBlack transition-[height]">
              <button
                onClick={signOut}
                className="h-full w-full cursor-pointer dark:text-white hover:bg-[#E2E7E9] dark:hover:bg-[#898c8d] active:bg-[#c0c5c7] dark:active:bg-[#5a5b5c]"
              >
                Sign-out
              </button>
              <Link
                href="/settings"
                className="h-full w-full text-center flex items-center justify-center dark:text-white hover:bg-[#E2E7E9] dark:hover:bg-[#898c8d] active:bg-[#c0c5c7] dark:active:bg-[#5a5b5c]"
              >
                Settings
              </Link>
            </div>
          </>
        ) : (
          <Link href="/auth">
            <ActionButton>Login</ActionButton>
          </Link>
        )}
      </div>
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        className="sm:hidden h-full min-w-6"
        data-collapse-toggle="navbar"
        aria-controls="navbar"
        aria-expanded={expanded}
      >
        <Menu className="h-full w-6 text-black dark:text-white" />
      </button>
      <aside
        onPointerDown={() => setExpanded(false)}
        className={`absolute z-20 sm:hidden dark:text-white font-medium top-full left-0 h-[calc(100vh-4rem)] ${expanded ? "w-screen" : "w-0"}`}
      >
        <ul
          onPointerDown={(e) => e.stopPropagation()}
          className={`transition-[width] overflow-clip text-nowrap h-full bg-white dark:bg-primaryBlack ${expanded ? "w-40" : "w-0"}`}
        >
          {user && (
            <>
              <HeaderLiButton active={isHome}>
                <Link className="w-full h-full flex items-center" href="/">
                  Home
                </Link>
              </HeaderLiButton>
              <HeaderLiButton active={isExplore}>
                <Link
                  className="w-full h-full flex items-center"
                  href="/explore"
                >
                  Explore
                </Link>
              </HeaderLiButton>
              <HeaderLiButton active={isBookmarks}>
                <Link
                  className="w-full h-full flex items-center"
                  href="/bookmarks"
                >
                  Bookmarks
                </Link>
              </HeaderLiButton>
              <HeaderLiButton active={isSettings}>
                <Link
                  className="w-full h-full flex items-center"
                  href="/settings"
                >
                  Settings
                </Link>
              </HeaderLiButton>
              <HeaderLiButton onClick={signOut}>Sign-out</HeaderLiButton>
            </>
          )}
          <HeaderLiButton
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="dark:before:content-['Dark_theme'] before:content-['Light_theme'] cursor-pointer"
          >
            <span className="sr-only">Toggle theme</span>
          </HeaderLiButton>
          {/* <li
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex h-10 items-center hover:bg-[#E2E7E9]  active:bg-[#c0c5c7] dark:bg-opacity-20! dark:before:content-['Dark_theme'] before:content-['Light_theme'] pl-4 cursor-pointer"
          ></li> */}
        </ul>
      </aside>
    </nav>
  );
}

function HeaderButton({
  active,
  children,
  ...props
}: LinkProps &
  Readonly<{
    active?: boolean;
    children: React.ReactNode;
  }>) {
  return (
    <Link
      {...props}
      className={`h-full select-none cursor-pointer flex justify-center items-center font-semibold text-sm ${active ? "border-b-2 border-solid border-primaryBlue text-primaryBlue" : "text-primaryGray dark:text-white"}`}
    >
      {children}
    </Link>
  );
}

function HeaderProfile({ user }: { user: User }) {
  return (
    <div className="flex gap-3 items-center">
      <div className="h-8 w-8">
        <UserAvatar src={user.avatar} size={64} />
      </div>
      <span className="text-xs dark:text-white max-w-48 text-ellipsis overflow-hidden font-bold whitespace-nowrap">
        {getUsername(user)}
      </span>
      <ChevronDown className="opacity-80 sm:hidden" />
    </div>
  );
}

function HeaderLiButton({
  active,
  children,
  className,
  ...props
}: Readonly<
  React.ComponentPropsWithoutRef<"li"> & {
    active?: boolean;
    children: React.ReactNode;
  }
>) {
  return (
    <li
      className={`w-full flex h-10 items-center hover:bg-[#E2E7E9] dark:hover:text-primaryBlack cursor-pointer pl-4 active:bg-[#c0c5c7] dark:bg-opacity-20! ${active ? "bg-zinc-400" : ""} ${className ? className : ""}`}
      {...props}
    >
      {children}
    </li>
  );
}
