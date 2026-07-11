import { InfiniteData } from "@tanstack/react-query";
import PostMain, { TWEET_LIST_KEY } from "./postMain";
import { ActionButton } from "../ui/actionButton";
import PostSkeleton from "./postSkeleton";

export default function PostsContainer({
  replyToId,
  isPending,
  isRefetching,
  hasNextPage,
  isFetching,
  listKeys,
  fetchNextPage,
  scrollLoaderCallback,
  data,
}: {
  listKeys: TWEET_LIST_KEY[];
  fetchNextPage: () => void;
  scrollLoaderCallback: (target: HTMLElement | null) => void;
  replyToId?: string;
  isPending?: boolean;
  isRefetching?: boolean;
  isFetching?: boolean;
  hasNextPage?: boolean;
  data?: InfiniteData<PaginationResponse<Tweet[]>>;
}) {
  return (
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
                key={
                  tweet.retweetedBy
                    ? `retweet-${tweet.retweetedBy}-${tweet.id}`
                    : tweet.id
                }
                listKeys={listKeys}
              />
            )),
          )
        : replyToId
          ? [1, 2].map((key) => (
              <PostSkeleton key={`skeleton-${replyToId}-${key}`} />
            ))
          : [1, 2, 3].map((key) => <PostSkeleton key={`skeleton-${key}`} />)}
      {data && hasNextPage && (
        <ActionButton
          disabled={isFetching}
          onClick={() => fetchNextPage()}
          ref={scrollLoaderCallback}
        >
          Load more
        </ActionButton>
      )}
    </div>
  );
}
