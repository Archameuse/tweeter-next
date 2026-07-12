import { TWEET_LIST_KEY } from "@/components/post/postMain";
import { create } from "zustand";

interface MediaData {
  src: string;
  isVideo?: boolean;
  timestamp?: number;
}

interface ReplyData {
  tweetId: string;
  listKeys: TWEET_LIST_KEY[];
}
/**
 * Potentially add something like prev reply stack so user can go back in nested replies
 * for now no reason to do something like this tho
 */
interface RepliesData {
  tweetId: string;
  listKeys: TWEET_LIST_KEY[];
}

/**
 * isFollowId - if True fetch followers of this user, if False fetch users this user follows
 */
interface FollowsData {
  userId: string;
  isFollowId?: boolean;
}

interface ModalData {
  mediaData: MediaData | null;
  replyData: ReplyData | null;
  repliesData: RepliesData | null;
  followsData: FollowsData | null;
  modalTimestamp?: number;
  setMediaData: (data: MediaData | null, timestamp?: number) => void;
  setReplyData: (data: ReplyData | null) => void;
  setRepliesData: (data: RepliesData | null) => void;
  setFollowsData: (data: FollowsData | null) => void;
}

/**
 * followsData -> isFollowId - if True fetch followers of this user, if False fetch users this user follows
 */
export const useModalStore = create<ModalData>((set) => ({
  mediaData: null,
  replyData: null,
  repliesData: null,
  followsData: null,
  setMediaData: (mediaData: MediaData | null, timestamp?: number) =>
    set({ mediaData, modalTimestamp: timestamp }),
  setReplyData: (replyData: ReplyData | null) => set({ replyData }),
  setRepliesData: (repliesData: RepliesData | null) => set({ repliesData }),
  setFollowsData: (followsData: FollowsData | null) => set({ followsData }),
}));
