"use client";
import { useUser } from "@/providers/UserProvider";
import { API_URL } from "@/utils/userHelpers";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { UserRoundMinus, UserRoundPlus } from "lucide-react";
import { ActionButton, BUTTON_VERSIONS } from "../ui/actionButton";

export enum USER_LIST_KEY {
  whoToFollow = "whoToFollow",
  profile = "profile",
  followersList = "followersList",
  followedList = "followedList",
}

type AnyUser = User | Profile;

export default function FollowButton({
  profileId,
  isFollowed,
  small,
  listKeys,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  profileId: string;
  listKeys: (USER_LIST_KEY | string)[][];
  isFollowed?: boolean;
  small?: boolean;
}) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async () => {
      const res = await axios(`${API_URL}/users/follow/${profileId}`, {
        withCredentials: true,
        method: isFollowed ? "DELETE" : "POST",
      });
      return res.data;
    },
    onMutate: async () => {
      const prevDataList: {
        key: readonly unknown[];
        data:
          | InfiniteData<PaginationResponse<AnyUser[]>, unknown>
          | AnyUser[]
          | AnyUser
          | undefined;
      }[] = [];
      for (const listKey of listKeys) {
        // const processedListKey = [
        //   ...listKey,
        //   ...(listKey === USER_LIST_KEY.profile ? [profileId] : []),
        // ];
        await queryClient.cancelQueries({
          queryKey: listKey,
          exact: false,
        });
        const [[prevKey, prevData]] = queryClient.getQueriesData<
          InfiniteData<PaginationResponse<AnyUser[]>> | AnyUser[] | AnyUser
        >({ queryKey: listKey, exact: false });
        queryClient.setQueriesData<
          InfiniteData<PaginationResponse<AnyUser[]>> | AnyUser[] | AnyUser
        >({ queryKey: listKey, exact: false }, (old) => {
          if (!old) return old;
          if ("pages" in old) {
            const returnData: InfiniteData<PaginationResponse<AnyUser[]>> = {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((user) =>
                  user.id === profileId
                    ? {
                        ...user,
                        followed: !user.followed,
                        ...("followers" in user
                          ? {
                              followers: user.followed
                                ? user.followers - 1
                                : user.followers + 1,
                            }
                          : {}),
                      }
                    : user,
                ),
              })),
            };
            return returnData;
          } else if (Array.isArray(old)) {
            const returnData: AnyUser[] = old.map((user) =>
              user.id === profileId
                ? {
                    ...user,
                    followed: !user.followed,
                    ...("followers" in user
                      ? {
                          followers: user.followed
                            ? user.followers - 1
                            : user.followers + 1,
                        }
                      : {}),
                  }
                : user,
            );
            return returnData;
          } else {
            const returnData: AnyUser = {
              ...old,
              followed: !old.followed,
              ...("followers" in old
                ? {
                    followers: old.followed
                      ? old.followers - 1
                      : old.followers + 1,
                  }
                : {}),
            };
            return returnData;
          }
        });
        prevDataList.push({ key: prevKey, data: prevData });
      }
      return { prevDataList };
    },
    onError: (err, _variables, context) => {
      if (context?.prevDataList) {
        for (const { key, data } of context.prevDataList) {
          queryClient.setQueriesData({ queryKey: key, exact: false }, data);
        }
      }
      // console.error(err);
      if (err instanceof AxiosError) {
        if (err.response?.data?.message) {
          return alert(err.response?.data?.message);
        }
      }
      return alert("Unknown error");
    },
  });

  if (!user || user.id === profileId) return null;
  return (
    <ActionButton
      {...props}
      className={`flex gap-1 justify-center items-center w-32 h-12 ${className ? className : ""}`}
      version={isFollowed ? BUTTON_VERSIONS.unfollow : BUTTON_VERSIONS.default}
      onClick={() => mutate()}
    >
      {isFollowed ? <UserRoundMinus /> : <UserRoundPlus />}
      <span
        className={`${small ? "text-xs font-normal" : "text-sm font-medium"} w-12`}
      >
        {isFollowed ? "Unfollow" : "Follow"}
      </span>
    </ActionButton>
    // <div
    //   {...props}
    //   onClick={() => mutate()}
    //   className={`relative select-none cursor-pointer rounded-md flex gap-1 justify-center items-center w-32 h-12 ${isFollowed ? "border-2 border-primaryGray text-primaryGray" : "bg-primaryBlue text-white"} ${!isPending ? "hover:opacity-80 active:opacity-90" : ""} ${className ? className : ""}`}
    // >
    //   {isFollowed ? <UserRoundPlus /> : <UserRoundMinus />}
    //   <span
    //     className={`${small ? "text-xs font-normal" : "text-sm font-medium"}`}
    //   >
    //     {isFollowed ? "Unfollow" : "Follow"}
    //   </span>
    //   {/* {isLoading && (
    //     <div className="absolute top-0 left-0 bottom-0 right-0 flex justify-center items-center z-10 cursor-wait">
    //       <Loader2 className="animate-spin" />
    //     </div>
    //   )} */}
    // </div>
  );
}
