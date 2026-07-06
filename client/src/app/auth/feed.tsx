"use client";
import { ActionButton } from "@/components/ui/actionButton";
import { useUser } from "@/providers/UserProvider";
import { passwordSchema } from "@/utils/zodSchemas";
import { useState } from "react";
import z from "zod";

enum AUTH_TYPE {
  signIn,
  signUp,
}

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});
const createSchema = loginSchema.extend({
  username: z.string(),
});

export default function SignInFeed() {
  const [authType, setAuthType] = useState<AUTH_TYPE>(AUTH_TYPE.signIn);
  const { login, create } = useUser();
  const handleAuth = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formValues = Object.fromEntries(formData.entries());
    let status;
    if (authType === AUTH_TYPE.signIn) {
      status = await login(loginSchema.parse(formValues));
    } else if (authType === AUTH_TYPE.signUp) {
      const data = createSchema.parse(formValues);
      const parsePassword = passwordSchema.safeParse(data.password);
      if (!parsePassword.success) return alert(parsePassword.error);
      status = await create(data);
    }
    if (status?.error) {
      alert(status.error);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
          {authType === AUTH_TYPE.signIn
            ? "Sign in to your account"
            : "Create new account"}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form
          onSubmit={handleAuth}
          className="space-y-6 [&_input]:bg-white [&_input]:dark:bg-primaryBlack"
          action="#"
          method="POST"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {authType === AUTH_TYPE.signUp && (
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
              >
                User name
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-white"
              >
                Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  authType === AUTH_TYPE.signIn
                    ? "current-password"
                    : "new-password"
                }
                required
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div className="flex gap-8 justify-between">
            <ActionButton type="submit">
              {authType === AUTH_TYPE.signIn ? "Sign in" : "Create user"}
            </ActionButton>
            <button
              type="button"
              className="underline cursor-pointer"
              onClick={() =>
                setAuthType((prev) =>
                  prev === AUTH_TYPE.signIn
                    ? AUTH_TYPE.signUp
                    : AUTH_TYPE.signIn,
                )
              }
            >
              Or {authType === AUTH_TYPE.signUp ? "Sign in" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
