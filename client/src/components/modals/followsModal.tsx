"use client";
import { useEffect, useRef } from "react";
import ModalMain from "../ui/mainModal";
import { useModalStore } from "@/store/useModalStore";
import { USER_LIST_KEY } from "../user/followButton";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { API_URL } from "@/utils/userHelpers";
import { Loader2 } from "lucide-react";
import TinyProfile from "../user/tinyProfile";
import useScrollObserverCallback from "@/utils/useScrollObserverCallback";
import { ActionButton } from "../ui/actionButton";

export default function FollowsModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalData = useModalStore((state) => state.followsData);
  const queryClient = useQueryClient();
  const setModalData = useModalStore((state) => state.setFollowsData);
  const {
    data,
    isError,
    error,
    isPending,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      modalData?.isFollowId
        ? USER_LIST_KEY.followersList
        : USER_LIST_KEY.followedList,
      modalData?.userId,
    ],
    queryFn: async ({ pageParam }) => {
      const res = await axios.get<PaginationResponse<Profile[]>>(
        `${API_URL}/users/follows`,
        {
          withCredentials: true,
          params: {
            cursor: pageParam,
            id: modalData?.userId,
            limit: 5,
            scope: modalData?.isFollowId ? "followers" : "follows",
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
  useEffect(() => {
    if (!modalData) {
      modalRef.current?.close();
      queryClient.invalidateQueries({
        queryKey: [USER_LIST_KEY.profile],
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
  const scrollLoaderRef = useScrollObserverCallback(fetchNextPage, {
    rootRef: modalContainerRef,
  });
  if (!modalData) return null;
  return (
    <ModalMain
      onClose={() => setModalData(null)}
      ref={modalRef}
      headline={modalData.isFollowId ? "Followers" : "Follows"}
      containerRef={modalContainerRef}
    >
      {isPending ? (
        <div className="h-6 z-10 w-full flex justify-center aspect-square float-right cursor-wait">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col grow min-w-0 px-8 gap-5 py-5">
          {data &&
            data.pages.flatMap((page) =>
              page.data.map((user) => (
                <TinyProfile
                  noBanner
                  user={user}
                  key={user.id}
                  listKeys={[
                    [
                      modalData?.isFollowId
                        ? USER_LIST_KEY.followersList
                        : USER_LIST_KEY.followedList,
                      modalData.userId,
                    ],
                  ]}
                />
              )),
            )}
          {hasNextPage && (
            <ActionButton
              disabled={isFetching}
              onClick={() => fetchNextPage()}
              ref={scrollLoaderRef}
            >
              Load more
            </ActionButton>
          )}
        </div>
      )}
    </ModalMain>
  );
}
