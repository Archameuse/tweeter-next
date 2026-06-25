import { useMemo } from "react";
import UnderlinedText from "./ui/underlinedText";
import symbolFormatter from "@/utils/symbolFormatter";

const mockTrends: Trend[] = [
  {
    id: 1,
    name: "NextJS15",
    tweets: 142500,
  },
  {
    id: 2,
    name: "TailwindCSS",
    tweets: 89300,
  },
  {
    id: 3,
    name: "React19",
    tweets: 124000,
  },
  {
    id: 4,
    name: "TypeScript",
    tweets: 65100,
  },
  {
    id: 5,
    name: "WebDev",
    tweets: 210500,
  },
];

export default function Trends() {
  if (!mockTrends) return null; // if we cant get and util we g et trends we return null
  return (
    <div className="w-full px-5 py-3 bg-white dark:bg-primaryBlack rounded-xl shadow-sm flex flex-col gap-6">
      <UnderlinedText>Trends for you</UnderlinedText>
      {mockTrends.map((trend) => (
        <Trend key={trend.id} tweets={trend.tweets}>
          {trend.name}
        </Trend>
      ))}
    </div>
  );
}

function Trend({
  tweets,
  children,
}: {
  tweets?: number;
  children: React.ReactNode;
}) {
  const formattedTweets = useMemo(() => symbolFormatter(tweets, 1), [tweets]);
  return (
    <div className="w-full flex flex-col gap-2 justify-between font-noto-sans text-left">
      <span className="text-base font-semibold">#{children}</span>
      <span v-if="tweets" className="text-primaryGray text-xs">
        {formattedTweets + " Tweets"}
      </span>
    </div>
  );
}
