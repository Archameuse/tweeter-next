"use server";

import { cookies } from "next/headers";
import { COOKIE_NAME } from "./userHelpers";

export const getServerCookie = async () =>
  (await cookies()).get(COOKIE_NAME)?.value;
