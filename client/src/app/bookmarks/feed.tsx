"use client";

import { PageContainer } from "@/components/ui/pageContainer";
import { SectionFragment } from "@/components/ui/sectionFragment";
import { STATUS } from "../explore/feed";
import { useEffect, useRef, useState } from "react";
import { TWEET_LIST_KEY } from "@/components/post/postMain";
import useScrollObserverCallback from "@/utils/useScrollObserverCallback";
import PostsContainer from "@/components/post/postsContainer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { API_URL } from "@/utils/userHelpers";
import axios, { AxiosError } from "axios";

export default function BookmarksFeed() {
  const [status, setStatus] = useState<STATUS>(STATUS.top);
  const pageContainerRef = useRef<HTMLDivElement>(null);
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
    queryKey: [TWEET_LIST_KEY.bookmarks, status],
    queryFn: async ({ pageParam }) => {
      const res = await axios.get<PaginationResponse<Tweet[]>>(
        `${API_URL}/tweets/bookmarks`,
        {
          withCredentials: true,
          params: {
            cursor: pageParam,
            limit: 3,
            scope: status.toLowerCase(),
          },
        },
      );
      // console.log(res.data);
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    placeholderData: (prev) => prev,
    select: (data) => {
      const exist = new Set<string>();
      const filteredPages = data.pages.map((page) => ({
        ...page,
        data: page.data.filter((tweet) => {
          if (exist.has(tweet.id)) return false;
          exist.add(tweet.id);
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
    <PageContainer ref={pageContainerRef}>
      <div>
        <aside className="sticky top-4 py-5 w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-white dark:bg-secondaryGray shadow-md dark:shadow-primaryBlack rounded-lg h-fit">
          <SectionFragment
            onClick={() => setStatus(STATUS.top)}
            active={status === STATUS.top}
          >
            Top
          </SectionFragment>
          <SectionFragment
            onClick={() => setStatus(STATUS.latest)}
            active={status === STATUS.latest}
          >
            Latest
          </SectionFragment>
          <SectionFragment
            onClick={() => setStatus(STATUS.media)}
            active={status === STATUS.media}
          >
            Media
          </SectionFragment>
        </aside>
      </div>
      <PostsContainer
        fetchNextPage={fetchNextPage}
        listKeys={[TWEET_LIST_KEY.bookmarks]}
        scrollLoaderCallback={scrollLoaderRef}
        data={data}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        isPending={isPending}
        isRefetching={isRefetching}
      />
    </PageContainer>
  );
}
