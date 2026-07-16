"use client";
import { ThemeProvider } from "@teispace/next-themes";
import { UserProvider } from "@/providers/UserProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const queryClient = new QueryClient();
  // hide "play" errors since they are literally serve no purpose
  useEffect(() => {
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      console.log(e.reason);
      if (e.reason?.name === "AbortError") e.preventDefault();
    };
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  });
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <UserProvider initialUser={initialUser}>
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
          {children}
        </UserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
