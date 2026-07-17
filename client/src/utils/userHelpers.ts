export const COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME || "session_id";
/**
 * actual request should start with /
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const USER_ONLY_ROUTES = new Set(["/", "/bookmarks", "/settings"]);
export const GUEST_ONLY_ROUTES = new Set(["/auth"]);

export const fetchMe = async (cookie?: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      cache: "no-store",
      credentials: "include",
      ...(cookie && {
        headers: {
          cookie: `${COOKIE_NAME}=${cookie}`,
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
export const fetchUser = async <T = User>(
  path: string,
  { cookie, ...options }: RequestInit & { cookie?: string } = {},
): Promise<{ data: T | null; error: string | null }> => {
  let data: T | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(cookie && { Cookie: `${COOKIE_NAME}=${cookie}` }),
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
