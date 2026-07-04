"use client";

import { fetchMe, fetchUser } from "@/utils/userHelpers";
import { createContext, useCallback, useContext, useState } from "react";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: UserCreateInput) => Promise<void>;
  login: (input: UserLoginInput) => Promise<void>;
  logout: () => Promise<void>;
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
  const refresh = useCallback(async () => {
    setLoading(true);
    setUser(await fetchMe());
    setLoading(false);
  }, []);
  const create = useCallback(async (input: UserCreateInput) => {
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
  }, []);
  const login = useCallback(async (input: UserLoginInput) => {
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
  }, []);
  const logout = useCallback(async () => {
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
  }, []);

  const clearError = () => setError(null);
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
