export const COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME || "session_id";
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const fetchMe = async (cookie?: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      cache: "no-cache",
      credentials: "include",
      ...(cookie && {
        headers: {
          Cookie: `${COOKIE_NAME}=${cookie}`,
        },
      }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    console.error("Network error. Please check your connection");
    return null;
  }
};

/**
 *
 * @param path Should start with /
 * @param options Credentials: 'include' by default and headers application/json
 */
export const fetchUser = async (
  path: string,
  options: RequestInit = {},
): Promise<{ data: User | null; error: string | null }> => {
  let data: User | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    if (res.ok) {
      if (res.status === 204) data = null;
      else data = await res.json();
    } else {
      error =
        (await res.json().catch(() => null))?.message ||
        `Server error: ${res.status}`;
    }
  } catch {
    error = "Network error. Please check your connection.";
  }
  return { data, error };
};
