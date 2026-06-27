import PostMain from "@/components/post/postMain";
import Trends from "@/components/Trends";
import TweetInput from "@/components/TweetInput";
import { PageContainer } from "@/components/ui/pageContainer";
import WhoToFollow from "@/components/whoToFollow";

export default function HomeFeed() {
  const loading = false;
  const mockTweets: Tweet[] = [
    {
      id: 1,
      content: "Building the future with Next.js and Tailwind CSS! 🚀",
      author: {
        id: 101,
        username: "tech_coder",
        image: "/temp/ (19).jpg",
        followed: true,
      },
      created_at: new Date("2026-06-23T10:00:00Z"),
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
      author: {
        id: 102,
        username: "nature_wanderer",
        image: "/temp/ (11).jpg",
      },
      created_at: new Date("2026-06-23T08:15:00Z"),
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
      author: {
        id: 103,
        username: "secret_agent",
        followed: false,
      },
      created_at: new Date("2026-06-22T22:30:00Z"),
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
      author: {
        id: 104,
        username: "dev_share",
        image: "/temp/ (1).jpg",
        followed: true,
      },
      created_at: new Date("2026-06-23T14:45:00Z"),
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
      author: {
        id: 105,
        username: "coffee_bytes",
      },
      created_at: new Date("2026-06-24T06:00:00Z"),
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
      <div className="flex flex-col gap-10 w-full h-fit">
        <TweetInput />
        <div
          className={`flex flex-col gap-10 max-w-xl m-auto w-full lg:max-w-fit ${loading && "blur-md cursor-wait **:pointer-events-none"}`}
        >
          {mockTweets.map((tweet) => (
            <PostMain tweet={tweet} key={tweet.id} />
          ))}
        </div>
      </div>
      <div className="hidden lg:flex flex-col gap-6 sticky top-4 w-96 h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-none">
        <Trends />
        <WhoToFollow />
      </div>
    </PageContainer>
  );
}
