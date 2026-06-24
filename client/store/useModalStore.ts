import { create } from "zustand";

interface MediaData {
  src: string;
  isVideo?: boolean;
  timestamp?: number;
}

interface ModalData {
  mediaData: MediaData | null;
  setMediaData: (data: MediaData) => void;
}

export const useModalStore = create<ModalData>((set) => ({
  mediaData: null,
  setMediaData: (mediaData: MediaData) => set({ mediaData }),
}));
