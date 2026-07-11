import { useMemo } from "react";
import UnderlinedText from "./ui/underlinedText";
import symbolFormatter from "@/utils/symbolFormatter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/utils/userHelpers";
import { Loader2 } from "lucide-react";

export default function Trends() {
  const { data, isError, isPending } = useQuery({
    queryKey: ["trends"],
    queryFn: async () => {
      const res = await axios.get<Trend[]>(`${API_URL}/tweets/trends`);
      return res.data;
    },
  });
  return (
    <div className="w-full px-5 py-3 bg-white dark:bg-primaryBlack rounded-xl shadow-sm flex flex-col gap-6">
      <UnderlinedText>Trends for you</UnderlinedText>
      {isError ? (
        <div>Unable to load trends</div>
      ) : isPending ? (
        <Loader2 className="animate-spin" />
      ) : (
        data &&
        data.map((trend) => (
          <Trend key={trend.id} tweets={trend.tweets}>
            {trend.hashtag}
          </Trend>
        ))
      )}
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
