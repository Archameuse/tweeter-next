"use client";
import { Loader2, UserRoundMinus, UserRoundPlus } from "lucide-react";
import { useState } from "react";

export default function FollowButton({
  profileId,
  isFollowed,
  small,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  profileId: number;
  isFollowed?: boolean;
  small?: boolean;
}) {
  const [localFollowed, setLocalFollowed] = useState<boolean>(!!isFollowed); //idk if needed
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const click = async () => {
    if (isLoading) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLocalFollowed((prev) => !prev);
    setIsLoading(false);
  };
  return (
    <div
      {...props}
      onClick={click}
      className={`relative select-none cursor-pointer rounded-md flex gap-1 justify-center items-center w-32 h-12 ${localFollowed ? "border-2 border-primaryGray text-primaryGray" : "bg-primaryBlue text-white"} ${!isLoading ? "hover:opacity-80 active:opacity-90" : ""} ${className ? className : ""}`}
    >
      {isLoading && (
        <div className="absolute top-0 left-0 bottom-0 right-0 flex justify-center items-center z-10 cursor-wait">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {localFollowed ? (
        <UserRoundPlus className={isLoading ? "opacity-0" : "-scale-x-100"} />
      ) : (
        <UserRoundMinus className={isLoading ? "opacity-0" : "-scale-x-100"} />
      )}
      <span
        className={`${small ? "text-xs font-normal" : "text-sm font-medium"} ${isLoading ? "opacity-0" : ""}`}
      >
        {localFollowed ? "Unfollow" : "Follow"}
      </span>
    </div>
  );
}
