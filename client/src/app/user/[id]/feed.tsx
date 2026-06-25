"use client";

import PostMain from "@/components/post/postMain";
import ImageWrapper from "@/components/ui/imageWrapper";
import { PageContainer } from "@/components/ui/pageContainer";
import { SectionFragment } from "@/components/ui/sectionFragment";
import ProfileTab from "@/components/user/profileTab";
import { useState } from "react";

const mockTweets: Tweet[] = [
  {
    id: 1,
    content: "Building the future with Next.js and Tailwind CSS! 🚀",
    user: {
      id: 101,
      username: "tech_coder",
      image: "/temp/ (14).jpg",
      followed: true,
    },
    date: new Date("2026-06-23T10:00:00Z"),
    likes: 42,
    replies: 5,
    retweets: 12,
    hashtag: "#webdev",
    image: "/temp/ (4).mp4",
    liked: true,
    saved: false,
    retweeted: false,
  },
  {
    id: 2,
    content:
      "Caught an incredible sunrise over the mountains this morning. Absolute perfection.",
    user: {
      id: 102,
      username: "nature_wanderer",
      image: "/temp/ (12).jpg",
    },
    date: new Date("2026-06-23T08:15:00Z"),
    likes: 128,
    replies: 24,
    retweets: 35,
    image: "/temp/ (17).jpg",
    liked: false,
    saved: true,
    retweeted: true,
  },
  {
    id: 3,
    content: "This is a private update exclusively for the inner circle.",
    user: {
      id: 103,
      username: "secret_agent",
      followed: false,
    },
    date: new Date("2026-06-22T22:30:00Z"),
    likes: 12,
    replies: 2,
    retweets: 1,
    onlyFollowers: true,
    liked: false,
    saved: false,
    retweeted: false,
  },
  {
    id: 4,
    content:
      "Check out this incredible open source tool I stumbled upon today!",
    user: {
      id: 104,
      username: "dev_share",
      image: "/temp/ (25).jpg",
      followed: true,
    },
    date: new Date("2026-06-23T14:45:00Z"),
    likes: 85,
    replies: 8,
    retweets: 19,
    retweetedBy: "tech_coder",
    hashtag: "#opensource",
    liked: true,
    saved: true,
    retweeted: true,
  },
  {
    id: 5,
    content: "Coffee secured. Code mode activated. Let's get to work.",
    user: {
      id: 105,
      username: "coffee_bytes",
    },
    date: new Date("2026-06-24T06:00:00Z"),
    likes: 310,
    replies: 45,
    retweets: 88,
    image: "/temp/ (28).jpg",
    liked: false,
    saved: false,
    retweeted: false,
  },
];

enum STATUS {
  tweets = "Tweets",
  replies = "Tweets & replies",
  media = "Media",
  likes = "Likes",
}

export default function UserFeed({ profile }: { profile?: Profile }) {
  const [status, setStatus] = useState<STATUS>(STATUS.tweets);
  const loadingTweets = false;
  if (!profile) return null; // would need to throw 404
  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row flex-wrap gap-6 w-full">
        {profile.banner && (
          <div className="w-full aspect-video max-h-96 grow relative rounded-lg overflow-hidden shadow-lg">
            <ImageWrapper src={profile.banner} />
          </div>
        )}
        <div>
          <aside className="sticky top-4 py-5 w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-white dark:bg-secondaryGray shadow-md dark:shadow-primaryBlack rounded-lg h-fit">
            <SectionFragment
              onClick={() => setStatus(STATUS.tweets)}
              active={status === STATUS.tweets}
            >
              {STATUS.tweets}
            </SectionFragment>
            <SectionFragment
              onClick={() => setStatus(STATUS.replies)}
              active={status === STATUS.replies}
            >
              {STATUS.replies}
            </SectionFragment>
            <SectionFragment
              onClick={() => setStatus(STATUS.media)}
              active={status === STATUS.media}
            >
              {STATUS.media}
            </SectionFragment>
            <SectionFragment
              onClick={() => setStatus(STATUS.likes)}
              active={status === STATUS.likes}
            >
              {STATUS.likes}
            </SectionFragment>
          </aside>
        </div>
        <div className="flex flex-col gap-10 w-full h-fit flex-1">
          <div
            className={`relative w-full max-w-3xl m-auto ${profile.banner ? "lg:relative lg:-top-12" : "my-12"}`}
          >
            <ProfileTab profile={profile} />
          </div>
          <div
            className={`flex flex-col gap-10 max-w-xl m-auto w-full lg:max-w-fit ${loadingTweets ? "blur-md cursor-wait **:pointer-events-none" : ""}`}
          >
            {mockTweets.map((tweet) => (
              <PostMain tweet={tweet} key={tweet.id} />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
