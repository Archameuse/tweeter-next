"use client";

import { PageContainer } from "@/components/ui/pageContainer";
import { SectionFragment } from "@/components/ui/sectionFragment";
import { STATUS } from "../explore/feed";
import { useState } from "react";
import PostMain from "@/components/post/postMain";

export default function BookmarksFeed() {
  const [status, setStatus] = useState<STATUS>(STATUS.top);
  const loading = false;
  const mockTweets: Tweet[] = [
    {
      id: 1,
      content: "Building the future with Next.js and Tailwind CSS! 🚀",
      user: {
        id: 101,
        username: "tech_coder",
        image: "/temp/ (19).jpg",
        followed: true,
      },
      date: new Date("2026-06-23T10:00:00Z"),
      likes: 42,
      replies: 5,
      retweets: 12,
      hashtag: "#webdev",
      image: "/temp/ (3).mp4",
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
        image: "/temp/ (11).jpg",
      },
      date: new Date("2026-06-23T08:15:00Z"),
      likes: 128,
      replies: 24,
      retweets: 35,
      image: "/temp/ (13).jpg",
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
        image: "/temp/ (1).jpg",
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
      image: "/temp/ (21).jpg",
      liked: false,
      saved: false,
      retweeted: false,
    },
  ];
  return (
    <PageContainer>
      <div>
        <aside className="sticky top-4 py-5 w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-white dark:bg-secondaryGray shadow-md dark:shadow-primaryBlack rounded-lg h-fit">
          <SectionFragment
            onClick={() => setStatus(STATUS.top)}
            active={status === STATUS.top}
          >
            {STATUS.top}
          </SectionFragment>
          <SectionFragment
            onClick={() => setStatus(STATUS.latest)}
            active={status === STATUS.latest}
          >
            {STATUS.latest}
          </SectionFragment>
          <SectionFragment
            onClick={() => setStatus(STATUS.media)}
            active={status === STATUS.media}
          >
            {STATUS.media}
          </SectionFragment>
        </aside>
      </div>
      <div
        className={`flex flex-col gap-10 max-w-xl m-auto w-full lg:max-w-fit ${loading && "blur-md cursor-wait [&_*]:pointer-events-none"}`}
      >
        {mockTweets.map((tweet) => (
          <PostMain tweet={tweet} key={tweet.id} />
        ))}
      </div>
    </PageContainer>
  );
}
