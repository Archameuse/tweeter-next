"use client";

import { TWEET_LIST_KEY } from "@/components/post/postMain";
import PostsContainer from "@/components/post/postsContainer";
import ImageWrapper from "@/components/ui/imageWrapper";
import { PageContainer } from "@/components/ui/pageContainer";
import { SectionFragment } from "@/components/ui/sectionFragment";
import { USER_LIST_KEY } from "@/components/user/followButton";
import ProfileTab from "@/components/user/profileTab";
import { API_URL } from "@/utils/userHelpers";
import useScrollObserverCallback from "@/utils/useScrollObserverCallback";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

// should correspond to backend filters
enum STATUS {
  tweets = "tweets",
  replies = "replies",
  media = "media",
  likes = "likes",
}

export default function UserFeed({
  initialProfile,
}: {
  initialProfile: Profile;
}) {
  const [status, setStatus] = useState<STATUS>(STATUS.tweets);
  const pageContainerRef = useRef<HTMLElement>(null);
  const {
    data: profile,
    error: profileError,
    isError: isProfileError,
  } = useQuery({
    queryKey: [USER_LIST_KEY.profile, initialProfile.id],
    initialData: initialProfile,
    queryFn: async () => {
      const res = await axios.get<Profile>(`${API_URL}/users`, {
        withCredentials: true,
        params: {
          id: initialProfile.id,
          scope: "profile",
        },
      });
      return res.data;
    },
  });

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
    queryKey: [TWEET_LIST_KEY.profile, initialProfile.id, status],
    queryFn: async ({ pageParam }) => {
      const res = await axios.get<PaginationResponse<Tweet[]>>(
        `${API_URL}/tweets/user`,
        {
          withCredentials: true,
          params: {
            cursor: pageParam,
            id: initialProfile.id,
            limit: 3,
            scope: status.toLowerCase(),
          },
        },
      );
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
    if (isProfileError) {
      if (axios.isAxiosError(profileError)) {
        const errorMessage = profileError.response?.data?.message;
        alert(errorMessage || profileError.message);
      } else {
        alert("Unknown error fetching profile");
      }
    }
    if (isError) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        alert(errorMessage || error.message);
      } else {
        alert("Unknown error fetching tweets");
      }
    }
  }, [isProfileError, profileError, error, isError]);
  const scrollLoaderRef = useScrollObserverCallback(fetchNextPage, {
    rootRef: pageContainerRef,
  });
  if (!profile)
    return (
      <div className="text-4xl text-center mt-8">
        Unexpected error cleared profile
      </div>
    ); // in case some hard error breaks profile data for some reason (realistically should not ever happen) outside test environment like throwing an error with react query devtools
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
              Tweets
            </SectionFragment>
            <SectionFragment
              onClick={() => setStatus(STATUS.replies)}
              active={status === STATUS.replies}
            >
              Tweets & replies
            </SectionFragment>
            <SectionFragment
              onClick={() => setStatus(STATUS.media)}
              active={status === STATUS.media}
            >
              Media
            </SectionFragment>
            <SectionFragment
              onClick={() => setStatus(STATUS.likes)}
              active={status === STATUS.likes}
            >
              Likes
            </SectionFragment>
          </aside>
        </div>
        <div className="flex flex-col gap-10 w-full h-fit flex-1">
          <div
            className={`relative w-full max-w-3xl m-auto ${profile.banner ? "lg:relative lg:-top-12" : "my-12"}`}
          >
            <ProfileTab profile={profile} />
          </div>
          <PostsContainer
            fetchNextPage={fetchNextPage}
            listKeys={[TWEET_LIST_KEY.profile]}
            scrollLoaderCallback={scrollLoaderRef}
            data={data}
            hasNextPage={hasNextPage}
            isFetching={isFetching}
            isPending={isPending}
            isRefetching={isRefetching}
          />
        </div>
      </div>
    </PageContainer>
  );
}
