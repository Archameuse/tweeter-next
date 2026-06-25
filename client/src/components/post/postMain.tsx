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
import { useMemo } from "react";
import symbolFormatter from "@/utils/symbolFormatter";
import PostAction, { POST_TYPE } from "./postAction";

export default function PostMain({ tweet }: { tweet: Tweet }) {
  const date = useMemo(() => {
    if (!tweet.date) return undefined;
    const now = new Date();
    const date = new Date(tweet.date);
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
  }, [tweet.date]);

  const hashtag = useMemo(
    () => tweet.hashtag?.replace(/^#+/, "") || "",
    [tweet.hashtag],
  );

  const canReply = useMemo(() => true, []);

  const retweetLoading = false;
  const likeLoading = false;
  const saveLoading = false;
  const retweetActive = false;
  const likeActive = false;
  const saveActive = false;

  return (
    <div className="w-full select-none">
      {tweet.retweetedBy && (
        <div className="pl-5 w-full flex items-center text-primaryGray dark:text-tertiaryGray">
          <Repeat2 />
          {tweet.retweetedBy} Retweeted
        </div>
      )}
      <div className="w-full p-5 bg-white dark:bg-primaryBlack shadow-md rounded-md flex flex-col gap-5">
        {tweet.reply?.id && (
          <div>
            Reply to
            <Link href={`/user/${tweet.reply.id}`}>@{tweet.reply.name}</Link>
          </div>
        )}
        {tweet.user && (
          <Link href={"/user/" + tweet.user.id}>
            <div className="flex h-10 gap-4">
              <UserAvatar src={tweet.user.image} size={80} />
              <div className="flex flex-col justify-between">
                <span className="text-base dark:text-white">
                  {tweet.user.username}
                </span>
                <span className="text-xs text-primaryGray dark:text-tertiaryGray">
                  {date}
                </span>
              </div>
            </div>
          </Link>
        )}
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
        <div className="p-4 flex gap-4 items-center border-y border-tertiaryGray">
          <PostAction icon={MessageSquare}>
            <span className="hidden sm:block">Comments</span>
          </PostAction>
          <PostAction
            icon={Repeat2}
            loading={retweetLoading}
            active={retweetActive}
            type={POST_TYPE.retweet}
          >
            <span className="hidden sm:block">Retweet</span>
          </PostAction>
          <PostAction
            icon={Heart}
            loading={likeLoading}
            active={likeActive}
            type={POST_TYPE.like}
          >
            <span className="hidden sm:block">Like</span>
          </PostAction>
          <PostAction
            icon={Bookmark}
            loading={saveLoading}
            active={saveActive}
            type={POST_TYPE.save}
          >
            <span className="hidden sm:block">Save</span>
          </PostAction>
        </div>
        {canReply && (
          <div className="min-h-10 h-fit flex gap-4">
            <div className="h-10">
              <UserAvatar size={64} src="/temp/ (25).jpg" />
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
