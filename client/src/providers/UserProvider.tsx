"use client";

import {
  fetchMe,
  fetchUser,
  GUEST_ONLY_ROUTES,
  USER_ONLY_ROUTES,
} from "@/utils/userHelpers";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

type ActionReturn = {
  success: boolean;
  error: string | null;
};

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: UserCreateInput) => Promise<ActionReturn>;
  login: (input: UserLoginInput) => Promise<ActionReturn>;
  logout: () => Promise<ActionReturn>;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const refresh = useCallback(async () => {
    setLoading(true);
    setUser(await fetchMe());
    setLoading(false);
  }, []);
  const create = useCallback(
    async (input: UserCreateInput): Promise<ActionReturn> => {
      setError(null);
      setLoading(true);
      const { data, error } = await fetchUser("/auth/create", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (error) {
        setError(error);
      } else {
        setUser(data);
      }
      setLoading(false);
      return { success: !error, error };
    },
    [],
  );
  const login = useCallback(
    async (input: UserLoginInput): Promise<ActionReturn> => {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchUser("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (error) {
        setError(error);
      } else {
        setUser(data);
      }
      setLoading(false);
      return { success: !error, error };
    },
    [],
  );
  const logout = useCallback(async (): Promise<ActionReturn> => {
    setLoading(true);
    const { error } = await fetchUser("/auth/logout", {
      method: "POST",
    });
    if (error) {
      setError(error);
    } else {
      setUser(null);
    }
    setLoading(false);
    return { success: !error, error };
  }, []);

  const clearError = () => setError(null);

  useLayoutEffect(() => {
    if (USER_ONLY_ROUTES.has(pathname) && !user) {
      router.replace("/explore");
    } else if (GUEST_ONLY_ROUTES.has(pathname) && user) {
      router.replace("/explore");
    }
  }, [user, pathname, router]);
  useEffect(() => {
    queryClient.invalidateQueries();
  }, [user, queryClient]);
  useEffect(() => {
    fetchMe().then((freshUser) => setUser(freshUser));
  }, [refresh]);

  // useEffect(() => {
  //   const onPageShow = async (e: PageTransitionEvent) => {
  //     console.log("CALLED");
  //     if (e.persisted) await refresh();
  //   };
  //   window.addEventListener("pageshow", onPageShow);
  //   return () => window.removeEventListener("pageshow", onPageShow);
  // }, [refresh]);
  if (
    (USER_ONLY_ROUTES.has(pathname) && !user) ||
    (GUEST_ONLY_ROUTES.has(pathname) && user)
  ) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        loading,
        user,
        error,
        create,
        login,
        logout,
        refresh,
        clearError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
