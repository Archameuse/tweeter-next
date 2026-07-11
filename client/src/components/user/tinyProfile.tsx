import Link from "next/link";
import { UserAvatar } from "../ui/userAvatar";
import getUsername from "@/utils/getUsername";
import symbolFormatter from "@/utils/symbolFormatter";
import ImageWrapper from "../ui/imageWrapper";
import UnderlinedText from "../ui/underlinedText";
import FollowButton, { USER_LIST_KEY } from "./followButton";

export default function TinyProfile({
  user,
  noBanner,
  listKeys,
}: {
  user: Profile;
  noBanner?: boolean;
  listKeys: USER_LIST_KEY[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center w-full justify-between flex-wrap gap-4">
        <Link href={`/user/${user.id}`} className="flex items-center gap-4">
          <div className="h-10">
            <UserAvatar src={user.avatar} size={64} />
          </div>
          <div className="flex flex-col justify-between">
            <span className="wrap-break-word">{getUsername(user)}</span>
            {(user.followers || user.followers === 0) && (
              <span className="text-primaryGray dark:text-white font-noto-sans text-xs">
                {symbolFormatter(user.followers, 0) + " Followers"}
              </span>
            )}
          </div>
        </Link>
        <FollowButton
          profileId={user.id}
          isFollowed={user.followed}
          listKeys={listKeys}
        />
      </div>
      {user.status && (
        <div>
          <p className="font-noto-sans text-sm text-primaryGray dark:text-white">
            {user.status}
          </p>
        </div>
      )}
      {user.banner && !noBanner && (
        <div className="w-full aspect-32/9 rounded-md shadow-sm overflow-hidden relative">
          <ImageWrapper src={user.banner} />
        </div>
      )}
      <UnderlinedText className={noBanner ? "p-0!" : ""}></UnderlinedText>
    </div>
  );
}
