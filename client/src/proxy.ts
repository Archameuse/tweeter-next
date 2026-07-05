import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  fetchMe,
  GUEST_ONLY_ROUTES,
  USER_ONLY_ROUTES,
} from "./utils/userHelpers";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  const isUser = !!(await fetchMe(cookie));
  if (USER_ONLY_ROUTES.has(pathname) && !isUser) {
    return NextResponse.redirect(new URL("/explore", request.url));
  } else if (GUEST_ONLY_ROUTES.has(pathname) && isUser) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  //   console.log(pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/auth", "/", "/bookmarks", "/settings"],
};
