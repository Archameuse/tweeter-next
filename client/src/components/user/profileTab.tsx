"use client";
import getUsername from "@/utils/getUsername";
import ImageWrapper from "../ui/imageWrapper";
import FollowButton, { USER_LIST_KEY } from "./followButton";
import { useMemo } from "react";
import symbolFormatter from "@/utils/symbolFormatter";
import { useModalStore } from "../../../store/useModalStore";

export default function ProfileTab({ profile }: { profile: Profile }) {
  const setData = useModalStore((state) => state.setFollowsData);
  const stylizedFollowing = useMemo(() => {
    const followed = profile.following || 0;
    if (followed >= 10000) return symbolFormatter(followed, 1);
    return followed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, [profile.following]);
  const stylizedFollowers = useMemo(() => {
    const followers = profile.followers || 0;
    if (followers >= 10000) return symbolFormatter(followers, 1);
    return followers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, [profile.followers]);

  return (
    <div className="bg-white dark:bg-primaryBlack h-full w-full rounded-2xl flex shadow-md px-6 py-4">
      <div className="min-h-16 min-w-16 max-h-16 max-w-16 sm:min-w-32 sm:min-h-32 sm:max-h-32 sm:max-w-32 lg:relative lg:-top-14 border-4 border-white rounded-lg overflow-hidden grow">
        <ImageWrapper src={profile.avatar} />
      </div>
      <div className="flex flex-col ml-5 gap-4 justify-center items-center">
        <div className="flex flex-wrap w-full text-xs font-semibold items-center gap-2">
          <h1 className="text-xl pr-6">{getUsername(profile)}</h1>
          <div className="flex flex-wrap gap-2 justify-start">
            <button
              className="flex gap-2 cursor-pointer pr-2"
              onClick={() => setData({ userId: profile.id, isFollowId: false })}
            >
              <span>{stylizedFollowing}</span>
              <span className="text-primaryGray dark:text-white font-medium">
                Following
              </span>
            </button>
            <button
              className="flex gap-2 cursor-pointer"
              onClick={() => setData({ userId: profile.id, isFollowId: true })}
            >
              <span>{stylizedFollowers}</span>
              <span className="text-primaryGray dark:text-white font-medium">
                Followers
              </span>
            </button>
          </div>
        </div>
        {profile.status && (
          <p className="w-full text-primaryGray dark:text-white sm:text-lg sm:font-medium [word-break:break-word]">
            {profile.status}
          </p>
        )}
      </div>
      <div className="ml-5 mt-4 w-20 sm:w-auto">
        <FollowButton
          profileId={profile.id}
          isFollowed={profile.followed}
          listKeys={[[USER_LIST_KEY.profile, profile.id]]}
        />
      </div>
    </div>
  );
}
