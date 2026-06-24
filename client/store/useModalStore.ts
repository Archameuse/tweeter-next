import { create } from "zustand";

interface MediaData {
  src: string;
  isVideo?: boolean;
  timestamp?: number;
}

interface ModalData {
  mediaData: MediaData | null;
  modalTimestamp?: number;
  setMediaData: (data: MediaData | null, timestamp?: number) => void;
}

export const useModalStore = create<ModalData>((set) => ({
  mediaData: null,
  setMediaData: (mediaData: MediaData | null, timestamp?: number) =>
    set({ mediaData, modalTimestamp: timestamp }),
}));
