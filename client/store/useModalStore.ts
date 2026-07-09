import { TWEET_LIST_KEY } from "@/components/post/postMain";
import { create } from "zustand";

interface MediaData {
  src: string;
  isVideo?: boolean;
  timestamp?: number;
}

interface ReplyData {
  tweetId: string;
}
interface RepliesData {
  tweetId: string;
  listKeys: TWEET_LIST_KEY[];
}

interface ModalData {
  mediaData: MediaData | null;
  replyData: ReplyData | null;
  repliesData: RepliesData | null;
  modalTimestamp?: number;
  setMediaData: (data: MediaData | null, timestamp?: number) => void;
  setReplyData: (data: ReplyData | null) => void;
  setRepliesData: (data: RepliesData | null) => void;
}

export const useModalStore = create<ModalData>((set) => ({
  mediaData: null,
  replyData: null,
  repliesData: null,
  setMediaData: (mediaData: MediaData | null, timestamp?: number) =>
    set({ mediaData, modalTimestamp: timestamp }),
  setReplyData: (replyData: ReplyData | null) => set({ replyData }),
  setRepliesData: (repliesData: RepliesData | null) => set({ repliesData }),
}));
