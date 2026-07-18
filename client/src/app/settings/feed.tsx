"use client";

import ActionIcon from "@/components/actionIcon";
import ImageCropModal from "@/components/modals/imageCropModal";
import ImageUploadModal from "@/components/modals/imageUploadModal";
import { ActionButton, BUTTON_VERSIONS } from "@/components/ui/actionButton";
import ImageWrapper from "@/components/ui/imageWrapper";
import validateImage from "@/utils/validateImage";
import { useMutation } from "@tanstack/react-query";
import { CheckCircleIcon, LucideImageMinus } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { API_URL } from "@/utils/userHelpers";
import { useUser } from "@/providers/UserProvider";
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
} from "@/utils/zodSchemas";

/**
 *
 * Need not to forget to add password here and email maybe at some point
 * + important to add account deletion
 */
export default function SettingsFeed({
  userSettings,
}: {
  userSettings: UserSettings;
}) {
  const { refresh: refreshUser } = useUser();
  const [localUserSettings, setLocalUserSettings] =
    useState<UserSettings>(userSettings);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(
    userSettings.avatar,
  );
  const [bannerUrl, setBannerUrl] = useState<string | null | undefined>(
    userSettings.banner,
  );
  const [avatarFile, setAvatarFile] = useState<File | "null" | undefined>(
    undefined,
  );
  const [bannerFile, setBannerFile] = useState<File | "null" | undefined>(
    undefined,
  );
  const [avatarProgress, setAvatarProgress] = useState<number>(0);
  const [bannerProgress, setBannerProgress] = useState<number>(0);
  const [showBannerModal, setShowBannerModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  // const isPending = true;
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const avatarSize = avatarFile instanceof File ? avatarFile.size : 0;
      const bannerSize = bannerFile instanceof File ? bannerFile.size : 0;
      const res = await axios.put(`${API_URL}/users/settings`, data, {
        withCredentials: true,
        /**
         *
         * This function does not do 100% correct calculation so bars are slightly off especially for smaller files and bigger texts
         * Still, they are close enough for fine UX and for smaller files, realistically they should be uploaded in 1-2 triggers so whatever anyway
         */
        onUploadProgress: (progress) => {
          if (avatarSize > 0) {
            const avatarLoad = Math.min(
              Math.floor((progress.loaded / avatarSize) * 100),
              100,
            );
            setAvatarProgress((prev) => (prev <= 100 ? avatarLoad : prev));
          }
          if (bannerSize > 0) {
            const bannerLoad = Math.max(
              Math.min(
                Math.floor(((progress.loaded - avatarSize) / bannerSize) * 100),
                100,
              ),
              0,
            );
            setBannerProgress((prev) => (prev <= 100 ? bannerLoad : prev));
          }
        },
      });
      return res.data;
    },
    onSuccess: async (newUser: UserSettings) => {
      await refreshUser();
      setLocalUserSettings(newUser);
      setAvatarFile(undefined);
      setBannerFile(undefined);
      alert("Success");
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data);
        if (err.request && !err.response)
          return alert(
            "Image upload is too big and vercel rejected it (I genuinely don't know what vercel's limit is so just try smaller images).",
          );
        if (err.response?.data.message) {
          return alert(err.response?.data.message);
        }
      }
      alert("Unknown error");
    },
    onSettled: () => {
      setAvatarProgress(0);
      setBannerProgress(0);
    },
  });

  const { mutate: deleteUser, isPending: pendingDeletion } = useMutation({
    mutationFn: async (password: string) => {
      const res = await axios.post(
        `${API_URL}/auth/delete`,
        { password },
        { withCredentials: true },
      );
      return res.data;
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data.message;
        if (typeof errorMessage === "string") {
          alert(errorMessage);
          return console.error(err.response?.data);
        }
      }
      alert("Unknown error");
    },
    onSuccess: async () => {
      alert("Success");
      await refreshUser();
    },
  });

  const openAvatarModal = () => {
    setShowAvatarModal(true);
  };
  const openBannerModal = () => {
    setShowBannerModal(true);
  };
  const handleSelectBanner = async (file: File) => {
    const { error, localUrl } = await validateImage(file, 2048);
    if (!localUrl) return alert(error);
    if (bannerUrl && bannerUrl.startsWith("blob:"))
      URL.revokeObjectURL(bannerUrl);
    setBannerUrl(localUrl);
    setBannerFile(file);
    setShowBannerModal(false);
  };

  const handleSelectAvatar = async (file: File) => {
    const { error, localUrl } = await validateImage(file, 2048);
    if (!localUrl) return alert(error);
    if (avatarUrl && avatarUrl.startsWith("blob:"))
      URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(localUrl);
    setAvatarFile(file);
    setShowAvatarModal(false);
  };

  const clearBanner = () => {
    if (bannerUrl && bannerUrl.startsWith("blob:"))
      URL.revokeObjectURL(bannerUrl);
    setBannerUrl(null);
    setBannerFile("null");
  };

  const clearAvatar = () => {
    if (avatarUrl && avatarUrl.startsWith("blob:"))
      URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(null);
    setAvatarFile("null");
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const settings: UserSettingsInput = {};
    const localFormData = new FormData(e.currentTarget);
    const formData = new FormData();
    const formUsername = localFormData.get("username")?.toString();
    const formEmail = localFormData.get("email")?.toString();
    const formPassword = localFormData.get("password")?.toString();
    const formConfirmPassword = localFormData
      .get("confirm-password")
      ?.toString();
    const formStatus = localFormData.get("status")?.toString();
    if (formUsername && formUsername !== localUserSettings.username) {
      const result = usernameSchema.safeParse(formUsername);
      if (!result.success) return alert(result.error.issues[0]?.message);
      settings.username = formUsername;
    }
    if (formEmail && formEmail !== localUserSettings.email) {
      const result = emailSchema.safeParse(formEmail);
      if (!result.success) return alert(result.error.issues[0]?.message);
      settings.email = formEmail;
    }
    if (formStatus !== (localUserSettings.status || "")) {
      //if no status we want to pass it as null still so it can clear
      settings.status = formStatus || null;
    }
    if (formPassword) {
      // might add validation here at some point
      // if(formPassword.length < 8) return alert("New password should be at least 8 characters long")
      const result = passwordSchema.safeParse(formPassword);
      if (!result.success) return alert(result.error.issues[0]?.message);
      if (!formConfirmPassword)
        return alert("Make sure you entered confirm password");
      if (formPassword !== formConfirmPassword)
        return alert(
          "Make sure your confirm password is the same as actual password",
        );
      const oldPassword = prompt("Enter your old password");
      if (!oldPassword) return alert("Your old password can't be empty");
      settings.password = formPassword;
      settings.oldPassword = oldPassword;
    }
    if (Object.keys(settings).length)
      formData.append("settings", JSON.stringify(settings));
    if (avatarFile !== undefined) formData.append("avatar", avatarFile);
    if (bannerFile !== undefined) formData.append("banner", bannerFile);
    if (!formData.entries().next().done) mutate(formData);
    else alert("Can't submit form without changes");
  };

  const handleReset = () => {
    // e.preventDefault();
    if (bannerUrl && bannerUrl.startsWith("blob:"))
      URL.revokeObjectURL(bannerUrl);
    if (avatarUrl && avatarUrl.startsWith("blob:"))
      URL.revokeObjectURL(avatarUrl);
    setBannerUrl(localUserSettings.banner);
    setBannerFile(undefined);
    setAvatarUrl(localUserSettings.avatar);
    setAvatarFile(undefined);
  };

  const handleDelete = async () => {
    const confirmationUsername = prompt(
      "If you sure you want to delete you profile, enter your username",
    );
    if (!confirmationUsername) return;
    if (confirmationUsername !== localUserSettings.username)
      return alert("Wrong username");
    const confirmationPassword = prompt(
      "If you want to proceed, enter correct password",
    );
    if (!confirmationPassword) return;
    deleteUser(confirmationPassword);
  };

  const disabledForm = isPending || pendingDeletion;

  return (
    <form
      className="w-full flex flex-col items-center gap-10"
      onSubmit={handleSubmit}
      onReset={handleReset}
    >
      <div className="flex w-full flex-wrap justify-between p-4 text-primaryGray border-b-gray-300 border-b">
        <h1 className="text-2xl">Settings</h1>
        <ActionButton
          version={BUTTON_VERSIONS.discard}
          onClick={handleDelete}
          disabled={disabledForm}
        >
          DELETE
        </ActionButton>
      </div>
      <div className="w-full max-w-5xl flex flex-col items-center gap-8">
        <FormInput
          defaultValue={localUserSettings.username}
          labelText="Username"
          nameId="username"
          required
          disabled={disabledForm}
        />
        <FormInput
          defaultValue={localUserSettings.status || ""}
          labelText="Status"
          nameId="status"
          disabled={disabledForm}
        />
        <FormInput
          defaultValue={localUserSettings.email}
          labelText="Email"
          nameId="email"
          type="email"
          required
          disabled={disabledForm}
        />
        <FormInput
          labelText="Password"
          nameId="password"
          type="password"
          disabled={disabledForm}
        />
        <FormInput
          labelText="Confirm password"
          nameId="confirm-password"
          type="password"
          disabled={disabledForm}
        />
        <div className="flex justify-end w-full gap-4">
          <label className="w-40 text-right">User avatar</label>
          <div className="w-full flex flex-wrap space-x-20 space-y-4">
            <div className="w-40 aspect-square relative rounded-2xl overflow-hidden border-4 border-primaryGray shadow-md">
              <ImageLoadbar progress={avatarProgress} />
              <ImageWrapper
                className={avatarProgress > 0 ? "blur-md" : ""}
                src={avatarUrl}
              />
              {avatarUrl && !disabledForm && (
                <div className="size-8 absolute right-4 top-4">
                  <ActionIcon icon={LucideImageMinus} onClick={clearAvatar} />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <ActionButton
                type="button"
                onClick={openAvatarModal}
                disabled={disabledForm}
              >
                Upload
              </ActionButton>
            </div>
          </div>
        </div>
        <div className="flex justify-end w-full gap-4">
          <label className="w-40 text-right">Profile banner</label>
          <div className="w-full flex flex-col gap-4 items-center">
            <div className="w-full h-60 relative rounded-2xl overflow-hidden border-4 border-primaryGray shadow-md">
              <ImageLoadbar progress={bannerProgress} />
              {bannerUrl && (
                <>
                  <ImageWrapper
                    className={bannerProgress > 0 ? "blur-md" : ""}
                    src={bannerUrl}
                  />
                  {!disabledForm && (
                    <div className="size-8 absolute right-4 top-4">
                      <ActionIcon
                        icon={LucideImageMinus}
                        onClick={clearBanner}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col justify-center w-40">
              <ActionButton
                type="button"
                onClick={openBannerModal}
                disabled={disabledForm}
              >
                Upload
              </ActionButton>
            </div>
          </div>
        </div>
        <div className="w-full flex gap-4 pl-40">
          <div className="flex w-full max-w-96 m-auto justify-between">
            <ActionButton
              type="reset"
              disabled={disabledForm}
              className="mr-2 mb-2"
              version={BUTTON_VERSIONS.discard}
            >
              Discard
            </ActionButton>
            <ActionButton
              type="submit"
              disabled={disabledForm}
              version={BUTTON_VERSIONS.green}
              className="mr-2 mb-2"
            >
              Accept
            </ActionButton>
            {/* <button
              type="submit"
              className="cursor-pointer focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
            >
            </button> */}
          </div>
        </div>
      </div>
      <ImageUploadModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onSelect={handleSelectBanner}
      />
      <ImageCropModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelect={handleSelectAvatar}
      />
    </form>
  );
}

export function ImageLoadbar({ progress }: { progress: number }) {
  if (progress <= 0) return null;

  return (
    <div className="absolute w-full h-full top-0 left-0 z-20 flex flex-col justify-center px-2">
      {progress < 100 ? (
        <div className="w-full bg-gray-300 rounded-full dark:bg-gray-700 ">
          <div
            className="bg-blue-600 text-xs select-none font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
            style={{ width: progress + "%" }}
          >
            {progress}%
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center">
          <CheckCircleIcon className="h-12 w-12 text-green-400" />
        </div>
      )}
    </div>
  );
}

function FormInput({
  disabled,
  defaultValue,
  labelText,
  nameId,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"input"> & {
  disabled?: boolean;
  defaultValue?: string;
  labelText: string;
  nameId: string;
}) {
  return (
    <div className="flex justify-end w-full gap-4 items-center">
      <label htmlFor={nameId} className="w-40 text-right">
        {labelText}
      </label>
      <input
        disabled={disabled}
        name={nameId}
        id={nameId}
        className={`${className ? className : ""} w-full bg-white border p-1 dark:bg-primaryBlack rounded-md disabled:opacity-60`}
        defaultValue={defaultValue || ""}
        placeholder={defaultValue || ""}
        {...props}
      />
    </div>
  );
}
