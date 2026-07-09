"use client";
import { useEffect, useRef } from "react";
import ModalMain from "../ui/mainModal";
import { useModalStore } from "../../../store/useModalStore";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import PostMain, { TWEET_LIST_KEY } from "./postMain";
import axios, { AxiosError } from "axios";
import { API_URL } from "@/utils/userHelpers";
import PostSkeleton from "./postSkeleton";
import { ActionButton } from "../ui/actionButton";
import useScrollObserverCallback from "@/utils/useScrollObserverCallback";

export default function PostRepliesModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalData = useModalStore((state) => state.repliesData);
  const setData = useModalStore((state) => state.setRepliesData);
  const queryClient = useQueryClient();
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
    queryKey: [TWEET_LIST_KEY.replies, modalData?.tweetId],
    queryFn: async ({ pageParam }) => {
      const res = await axios.get<PaginationResponse<Tweet[]>>(
        `${API_URL}/tweets/replies`,
        {
          withCredentials: true,
          params: {
            cursor: pageParam,
            id: modalData?.tweetId,
            limit: 3,
          },
        },
      );
      // console.log(res.data);
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    placeholderData: (prev) => prev,
    staleTime: 10 * 60 * 1000,
    select: (data) => {
      const exist = new Set<string>();
      const filteredPages = data.pages.filter((page) => ({
        ...page,
        data: page.data.map((tweet) => {
          if (exist.has(tweet.id)) return false;
          exist.add(tweet.id);
          return true;
        }),
      }));
      return { ...data, pages: filteredPages };
    },
    enabled: !!modalData,
  });
  const scrollLoaderRef = useScrollObserverCallback(fetchNextPage, {
    rootRef: modalContainerRef,
  });
  useEffect(() => {
    if (!modalData) {
      modalRef.current?.close();
      queryClient.invalidateQueries({
        queryKey: [TWEET_LIST_KEY.replies],
        exact: false,
      });
      return;
    }
    modalRef.current?.showModal();
  }, [modalData, queryClient]);

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

  if (!modalData) return null;
  return (
    <ModalMain
      onClose={() => setData(null)}
      ref={modalRef}
      headline="Replies"
      containerRef={modalContainerRef}
    >
      <div
        className={`
            flex flex-col gap-10 max-w-xl m-auto w-full lg:max-w-fit
          ${isRefetching && "blur-md cursor-wait **:pointer-events-none"}
        `}
      >
        {!isPending && data?.pages
          ? data.pages.flatMap((page) =>
              page.data.map((tweet) => (
                <PostMain
                  tweet={tweet}
                  key={tweet.id}
                  listKeys={modalData.listKeys}
                />
              )),
            )
          : [1, 2].map((key) => (
              <PostSkeleton key={`skeleton-${modalData.tweetId}-${key}`} />
            ))}
        {data && hasNextPage && (
          <ActionButton
            disabled={isFetching}
            onClick={() => fetchNextPage()}
            ref={scrollLoaderRef}
          >
            Load more
          </ActionButton>
        )}
      </div>
    </ModalMain>
  );
}
