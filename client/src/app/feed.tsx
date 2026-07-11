"use client";
import { TWEET_LIST_KEY } from "@/components/post/postMain";
import PostsContainer from "@/components/post/postsContainer";
import Trends from "@/components/Trends";
import TweetInput from "@/components/TweetInput";
import { PageContainer } from "@/components/ui/pageContainer";
import WhoToFollow from "@/components/whoToFollow";
import { API_URL } from "@/utils/userHelpers";
import useScrollObserverCallback from "@/utils/useScrollObserverCallback";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useEffect, useRef } from "react";

export default function HomeFeed() {
  const pageContainerRef = useRef<HTMLElement>(null);
  const {
    data,
    isError,
    error,
    isRefetching,
    isPending,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [TWEET_LIST_KEY.home],
    queryFn: async ({ pageParam }) => {
      const res = await axios.get<PaginationResponse<Tweet[]>>(
        `${API_URL}/tweets/user`,
        {
          withCredentials: true,
          params: {
            cursor: pageParam,
            limit: 3,
          },
        },
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    placeholderData: (prev) => prev,
    staleTime: 10 * 60 * 1000,
    select: (data) => {
      const exist = new Set<string>();
      const filteredPages = data.pages.map((page) => ({
        ...page,
        data: page.data.filter((tweet) => {
          const id = tweet.retweetedBy
            ? `retweet-${tweet.retweetedBy}-${tweet.id}`
            : tweet.id;
          if (exist.has(id)) return false;
          exist.add(id);
          return true;
        }),
      }));
      return { ...data, pages: filteredPages };
    },
  });
  useEffect(() => {
    if (isError) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message;
        alert(errorMessage || error.message);
      } else {
        alert("Unknown error");
      }
    }
  }, [isError, error]);
  const scrollLoaderRef = useScrollObserverCallback(fetchNextPage, {
    rootRef: pageContainerRef,
  });
  return (
    <PageContainer>
      <div className="flex flex-col gap-10 w-full h-fit">
        <TweetInput listKeys={[TWEET_LIST_KEY.home]} />
        <PostsContainer
          fetchNextPage={fetchNextPage}
          listKeys={[TWEET_LIST_KEY.home]}
          scrollLoaderCallback={scrollLoaderRef}
          data={data}
          hasNextPage={hasNextPage}
          isFetching={isFetching}
          isPending={isPending}
          isRefetching={isRefetching}
        />
      </div>
      <div className="hidden lg:flex flex-col gap-6 sticky top-4 w-96 h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-none">
        <Trends />
        <WhoToFollow />
      </div>
    </PageContainer>
  );
}
