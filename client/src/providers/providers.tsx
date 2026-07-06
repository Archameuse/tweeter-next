"use client";
import { ThemeProvider } from "@teispace/next-themes";
import { UserProvider } from "@/providers/UserProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const queryClient = new QueryClient();
  return (
    <ThemeProvider>
      <UserProvider initialUser={initialUser}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
