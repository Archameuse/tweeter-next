"use client";

import PostMain from "@/components/post/postMain";
import PostSkeleton from "@/components/post/postSkeleton";
import { PageContainer } from "@/components/ui/pageContainer";
import { SectionFragment } from "@/components/ui/sectionFragment";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { API_URL } from "@/utils/userHelpers";

export enum STATUS {
  top = "Top",
  latest = "Latest",
  media = "Media",
}
export default function ExploreFeed() {
  const [status, setStatus] = useState<STATUS>(STATUS.top);
  const [search, setSearch] = useState<string>("");
  const searchEvent = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  const { data, isError, error, isRefetching, isPending, isSuccess } = useQuery(
    {
      queryKey: ["exploreTweets"],
      queryFn: async () => {
        const res = await axios.get<Tweet[]>(`${API_URL}/tweets/explore`, {
          withCredentials: true,
          params: {
            page: 1,
            limit: 10,
            scope: status.toLowerCase(),
            search,
          },
        });
        return res.data;
      },
    },
  );
  useEffect(() => {
    if (isError) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message;
        alert(errorMessage || error.message);
      } else {
        alert("Unknown error");
      }
    }
  });

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
      <div className="flex flex-col gap-10 w-full h-fit">
        <form onSubmit={searchEvent} className="w-full">
          <label
            htmlFor="tweet-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 inset-s-0 flex items-center ps-3 pointer-events-none">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="search"
              id="tweet-search"
              className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search..."
              v-model="search"
            />
            <button
              type="submit"
              className="text-white absolute cursor-pointer inset-e-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2 active:opacity-80"
            >
              Search
            </button>
          </div>
        </form>
        <div
          className={`
            flex flex-col gap-10 max-w-xl m-auto w-full lg:max-w-fit
          ${isRefetching && "blur-md cursor-wait **:pointer-events-none"}
        `}
        >
          {/* <ProfilePost
          v-for="tweet in tweets"
          @refresh-reply="refresh"
          :post="tweet"
        /> */}
          {/* {mockTweets.map((tweet) => (
            <PostMain tweet={tweet} key={tweet.id} />
          ))} */}
          {/* {mockTweets.map((tweet) => (
            <PostMain tweet={tweet} key={tweet.id} />
          ))} */}
          {isSuccess && data
            ? data.map((tweet) => <PostMain tweet={tweet} key={tweet.id} />)
            : [1, 2, 3].map((key) => <PostSkeleton key={`skeleton-${key}`} />)}
        </div>
      </div>
    </PageContainer>
  );
}
