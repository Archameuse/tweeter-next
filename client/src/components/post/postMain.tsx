import { Repeat2 } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "../ui/userAvatar";
import PostImage from "./postImage";

const date = (tweetDate: Date) => {
  if (!tweetDate) return undefined;
  const now = new Date();
  const date = new Date(tweetDate);
  const getTime = () => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHours = hours < 10 ? "0" + hours : hours;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${formattedHours}:${formattedMinutes}`;
  };
  const monthName = (month: number): string => {
    if (month > 11) month = 11;
    if (month < 0) month = 0;
    const monthNames = [
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
    ];
    return monthNames[Math.floor(month)];
  };
  if (now.getFullYear() > date.getFullYear())
    return `${monthName(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}`;
  if (now.getDate() === date.getDate() && now.getMonth() === date.getMonth())
    return `Today, at ${getTime()}`;
  return `${date.getDate()} ${monthName(date.getMonth())} at ${getTime()}`;
};

const stripHash = (hashtag: string) => hashtag.replace(/^#+/, "");
export default function PostMain({ tweet }: { tweet: Tweet }) {
  return (
    <div className="w-full select-none">
      {tweet.retweetedBy && (
        <div className="ml-5 w-full flex items-center text-primaryGray dark:text-tertiaryGray">
          <Repeat2 />
          {tweet.retweetedBy} Retweeted
        </div>
      )}
      <div className="w-full p-5 bg-white dark:bg-primaryBlack shadow-md rounded-md flex flex-col gap-5">
        {tweet.reply?.id && (
          <div>
            Reply to
            <Link href={`./users/${tweet.reply.id}`}>@{tweet.reply.name}</Link>
          </div>
        )}
        {tweet.user && (
          <Link href={"/users/" + tweet.user.id}>
            <div className="flex h-10 gap-4">
              <UserAvatar src={tweet.user.image} size={80} />
              <div className="flex flex-col justify-between">
                <span className="text-base dark:text-white">
                  {tweet.user.username}
                </span>
                <span className="text-xs text-primaryGray dark:text-tertiaryGray">
                  {date(tweet.date)}
                </span>
              </div>
            </div>
          </Link>
        )}
        <div className="font-noto-sans text-secondaryGray dark:text-white">
          <p>{tweet.content}</p>
          {tweet.hashtag && (
            <p className="mt-4 opacity-60">{"#" + stripHash(tweet.hashtag)}</p>
          )}
        </div>
        {tweet.image && (
          <div className="w-full h-96 rounded-md shadow-sm overflow-hidden relative">
            <PostImage src={tweet.image} />
          </div>
        )}
      </div>
    </div>
  );
}
