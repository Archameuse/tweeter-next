"use client";

import ActionIcon from "@/components/actionIcon";
import ImageCropModal from "@/components/modals/imageCropModal";
import ImageUploadModal from "@/components/modals/imageUploadModal";
import { ActionButton } from "@/components/ui/actionButton";
import ImageWrapper from "@/components/ui/imageWrapper";
import validateImage from "@/utils/validateImage";
import { LucideImageMinus } from "lucide-react";
import { useState } from "react";

const mockUser: UserSettings = {
  id: 1,
  username: "Cool-User",
  banner: "/temp/ (23).jpg",
  image: "/temp/ (1).jpg",
  status: "My status",
};
export default function SettingsFeed() {
  const [user, setUser] = useState<UserSettings>(mockUser);
  const [avatarProgress, setAvatarProgress] = useState<number>(0);
  const [bannerProgress, setBannerProgress] = useState<number>(0);
  const [showBannerModal, setShowBannerModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(true);
  const openAvatarModal = () => {
    setShowAvatarModal(true);
  };
  const openBannerModal = () => {
    setShowBannerModal(true);
  };
  const handleSelectBanner = async (file: File) => {
    const { error, localUrl } = await validateImage(file, 10);
    if (!localUrl) return alert(error);
    if (user.banner && user.banner.startsWith("blob:"))
      URL.revokeObjectURL(user.banner);
    setUser((prev) => ({ ...prev, banner: localUrl }));
    setShowBannerModal(false);
  };

  const handleSelectAvatar = async (file: File) => {
    // validated in crop modal already before cropping
    // so just create url for cropped image
    // and update user
    const localUrl = URL.createObjectURL(file);
    if (user.image && user.image.startsWith("blob:"))
      URL.revokeObjectURL(user.image);
    setUser((prev) => ({ ...prev, image: localUrl }));
    setShowAvatarModal(false);
  };

  const clearBanner = () => {
    if (user.banner && user.banner.startsWith("blob:"))
      URL.revokeObjectURL(user.banner);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setUser(({ banner, ...prev }) => prev);
  };

  const clearAvatar = () => {
    if (user.image && user.image.startsWith("blob:"))
      URL.revokeObjectURL(user.image);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setUser(({ image, ...prev }) => prev);
  };
  if (!user) return null; // should be 404 realistically
  return (
    <form
      className="w-full flex flex-col items-center gap-10"
      onSubmit={(e) => e.preventDefault()}
      onReset={() => setUser(mockUser)}
    >
      <div className="flex w-full justify-center p-4 text-primaryGray border-b-gray-300 border-b">
        <h1 className="text-2xl w-full max-w-5xl">Settings</h1>
      </div>
      <div className="w-full max-w-5xl flex flex-col items-center gap-8">
        <div className="flex justify-end w-full gap-4 items-center">
          <p className="w-40 text-right">Username</p>
          <input
            className="w-full bg-white border p-1 dark:bg-primaryBlack rounded-md"
            defaultValue={user.username}
            placeholder={user.username}
          />
        </div>
        <div className="flex justify-end w-full gap-4 items-center">
          <p className="w-40 text-right">Status</p>
          <input
            className="w-full bg-white border p-1 dark:bg-primaryBlack rounded-md"
            defaultValue={user.status || ""}
            placeholder={user.status || ""}
          />
        </div>
        <div className="flex justify-end w-full gap-4">
          <p className="w-40 text-right">User avatar</p>
          <div className="w-full flex flex-wrap space-x-20 space-y-4">
            <div className="w-40 aspect-square relative rounded-2xl overflow-hidden border-4 border-primaryGray shadow-md">
              {avatarProgress > 0 && (
                <div className="absolute w-full h-full top-0 left-0 z-20 flex flex-col justify-center">
                  <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className="bg-blue-600 text-xs select-none font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                      style={{ width: avatarProgress + "%" }}
                    >
                      {avatarProgress}%
                    </div>
                  </div>
                </div>
              )}
              <ImageWrapper
                className={avatarProgress > 0 ? "blur-md" : ""}
                src={user.image}
              />
              {user.image && (
                <div className="size-8 absolute right-4 top-4">
                  <ActionIcon icon={LucideImageMinus} onClick={clearAvatar} />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <ActionButton type="button" onClick={openAvatarModal}>
                Upload
              </ActionButton>
            </div>
          </div>
        </div>
        <div className="flex justify-end w-full gap-4">
          <p className="w-40 text-right">Profile banner</p>
          <div className="w-full flex flex-col gap-4 items-center">
            <div className="w-full h-60 relative rounded-2xl overflow-hidden border-4 border-primaryGray shadow-md">
              {bannerProgress > 0 && (
                <div className="absolute w-full h-full top-0 left-0 z-20 flex flex-col justify-center">
                  <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className="bg-blue-600 text-xs select-none font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                      style={{ width: bannerProgress + "%" }}
                    >
                      {bannerProgress}%
                    </div>
                  </div>
                </div>
              )}
              {user.banner && (
                <>
                  <ImageWrapper
                    className={bannerProgress > 0 ? "blur-md" : ""}
                    src={user.banner}
                  />
                  <div className="size-8 absolute right-4 top-4">
                    <ActionIcon icon={LucideImageMinus} onClick={clearBanner} />
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col justify-center w-40">
              <ActionButton type="button" onClick={openBannerModal}>
                Upload
              </ActionButton>
            </div>
          </div>
        </div>
        <div className="w-full flex gap-4 ml-[calc(min(9rem,max(calc(40%-9rem),0)))]">
          <div className="flex w-full max-w-96 m-auto justify-between">
            <button
              type="reset"
              className="cursor-pointer text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
            >
              Discard
            </button>
            <button
              type="submit"
              className="cursor-pointer focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
            >
              Accept
            </button>
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
