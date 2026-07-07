"use client";
import {
  Bookmark,
  Heart,
  LucideImage,
  MessageSquare,
  Repeat2,
} from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "../ui/userAvatar";
import PostImage from "./postImage";
import { useCallback, useMemo } from "react";
import symbolFormatter from "@/utils/symbolFormatter";
import PostAction, { POST_ACTION } from "./postAction";
import { useUser } from "@/providers/UserProvider";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { API_URL } from "@/utils/userHelpers";

export enum TWEET_LIST_KEY {
  explore = "exploreTweets",
  bookmarks = "bookmarksTweets",
  replies = "repliesTweets",
  profile = "profileTweets",
}

export default function PostMain({
  tweet,
  listKey,
}: {
  tweet: Tweet;
  listKey: TWEET_LIST_KEY;
}) {
  const { user } = useUser();
  const date = useMemo(() => {
    if (!tweet.created_at) return undefined;
    const now = new Date();
    const date = new Date(tweet.created_at);
    const getTime = () => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedHours = hours < 10 ? "0" + hours : hours;
      const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
      return `${formattedHours}:${formattedMinutes}`;
    };
    const monthName = (month: number): string =>
      [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ][month % 12];
    if (now.getFullYear() !== date.getFullYear())
      return `${monthName(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}`;
    if (now.getDate() === date.getDate() && now.getMonth() === date.getMonth())
      return `Today, at ${getTime()}`;
    return `${date.getDate()} ${monthName(date.getMonth())} at ${getTime()}`;
  }, [tweet.created_at]);

  const hashtag = useMemo(
    () => tweet.hashtag?.replace(/^#+/, "") || "",
    [tweet.hashtag],
  );

  //NEED TO ADD GET FROM DATABASE ON TWEET AM I CURRENTLY LOGGED IN USER A FOLLOWED ONE OF AUTHOR
  const canReply = useMemo(
    () => user && (!tweet.onlyFollowers || tweet.replyAllowed),
    [user, tweet.onlyFollowers, tweet.replyAllowed],
  );

  const retweetLoading = false;
  const likeLoading = false;
  const saveLoading = false;
  const retweetActive = false;
  const likeActive = false;
  const saveActive = false;
  const actionState = useCallback(
    (action: POST_ACTION) => {
      if (action === POST_ACTION.like) return tweet.liked;
      if (action === POST_ACTION.retweet) return tweet.retweeted;
      if (action === POST_ACTION.save) return tweet.saved;
      return false;
    },
    [tweet.liked, tweet.retweeted, tweet.saved],
  );

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (action: POST_ACTION) =>
      await axios(`${API_URL}/tweets/${action}/${tweet.id}`, {
        method: actionState(action) ? "DELETE" : "POST",
        withCredentials: true,
      }),
    onMutate: async (action: POST_ACTION) => {
      await queryClient.cancelQueries({ queryKey: [listKey], exact: false });
      const prevData = queryClient.getQueryData<
        InfiniteData<PaginationResponse<Tweet[]>>
      >([listKey]);
      queryClient.setQueriesData<InfiniteData<PaginationResponse<Tweet[]>>>(
        { queryKey: [listKey], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((t) =>
                t.id === tweet.id
                  ? {
                      ...t,
                      ...(action === POST_ACTION.like && {
                        likes: t.liked ? t.likes - 1 : t.likes + 1,
                        liked: !t.liked,
                      }),
                      ...(action === POST_ACTION.retweet && {
                        retweets: t.retweeted ? t.retweets - 1 : t.retweets + 1,
                        retweeted: !t.retweeted,
                      }),
                      ...(action === POST_ACTION.save && {
                        saves: t.saved ? t.saves - 1 : t.saves + 1,
                        saved: !t.saved,
                      }),
                    }
                  : t,
              ),
            })),
          };
        },
      );
      return { prevData };
    },
    onError: (err, _variables, context) => {
      if (context?.prevData) {
        queryClient.setQueriesData(
          { queryKey: [listKey], exact: false },
          context.prevData,
        );
      }
      if (err instanceof AxiosError) {
        if (err.response?.data?.message) {
          console.error(err);
          return alert(err.response?.data?.message);
        }
      }
      return alert("Unknown error");
    },
  });

  return (
    <div className="w-full select-none">
      {tweet.retweetedBy && (
        <div className="pl-5 w-full flex items-center text-primaryGray dark:text-tertiaryGray">
          <Repeat2 />
          {tweet.retweetedBy} Retweeted
        </div>
      )}
      <div className="w-full p-5 bg-white dark:bg-primaryBlack shadow-md rounded-md flex flex-col gap-5">
        {tweet.replyTo?.id && (
          <div>
            Reply to
            <Link href={`/user/${tweet.replyTo.id}`}>
              @{tweet.replyTo.username}
            </Link>
          </div>
        )}

        <Link href={"/user/" + tweet.author.id}>
          <div className="flex h-10 gap-4">
            <UserAvatar src={tweet.author.avatar} size={80} />
            <div className="flex flex-col justify-between">
              <span className="text-base dark:text-white">
                {tweet.author.username}
              </span>
              <span className="text-xs text-primaryGray dark:text-tertiaryGray">
                {date}
              </span>
            </div>
          </div>
        </Link>
        <div className="font-noto-sans text-secondaryGray dark:text-white">
          <p>{tweet.content}</p>
          {tweet.hashtag && <p className="mt-4 opacity-60">{"#" + hashtag}</p>}
        </div>
        {tweet.image && (
          <div className="w-full h-96 rounded-md shadow-sm overflow-hidden relative">
            <PostImage src={tweet.image} />
          </div>
        )}
        <ul className="flex text-primaryGray dark:text-tertiaryGray text-xs font-noto-sans justify-end gap-4">
          <li>{symbolFormatter(tweet.replies, 1)} Comments</li>
          <li>{symbolFormatter(tweet.retweets, 1)} Retweets</li>
          <li>{symbolFormatter(tweet.likes, 1)} Likes</li>
        </ul>
        <div className="p-4 flex gap-4 items-center border-y border-skeletonColor">
          <PostAction icon={MessageSquare}>
            <span className="hidden sm:block">Comments</span>
          </PostAction>
          <PostAction
            icon={Repeat2}
            active={tweet.retweeted}
            action={POST_ACTION.retweet}
            disabled={isPending}
            onClick={() => mutate(POST_ACTION.retweet)}
          >
            <span className="hidden sm:block">Retweet</span>
          </PostAction>
          <PostAction
            icon={Heart}
            active={tweet.liked}
            action={POST_ACTION.like}
            disabled={isPending}
            onClick={() => mutate(POST_ACTION.like)}
          >
            <span className="hidden sm:block">Like</span>
          </PostAction>
          <PostAction
            icon={Bookmark}
            active={tweet.saved}
            action={POST_ACTION.save}
            disabled={isPending}
            onClick={() => mutate(POST_ACTION.save)}
          >
            <span className="hidden sm:block">Save</span>
          </PostAction>
        </div>
        {canReply && (
          <div className="min-h-10 h-fit flex gap-4">
            <div className="h-10">
              <UserAvatar size={64} src={user?.avatar} />
            </div>
            <div className="grow cursor-pointer min-h-full overflow-y-auto max-h-96 px-3 py-2 text-sm font-noto-sans bg-tertiaryGray dark:bg-secondaryGray rounded-xl">
              <div className="h-6 z-10 aspect-square float-right cursor-pointer">
                <LucideImage className="text-[#BDBDBD] dark:text-tertiaryGray w-full h-full hover:text-secondaryGray dark:hover:text-primaryGray active:text-primaryBlack dark:active:text-primaryBlack" />
              </div>
              <div className="min-h-full bg-transparent text-justify focus:outline-none wrap-break-words [hyphens:auto] empty:before:content-[attr(placeholder)] before:pointer-events-none text-[#BDBDBD] dark:text-tertiaryGray focus:invisible">
                Tweet your reply
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
