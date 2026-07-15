"use client";
import { useEffect, useRef } from "react";
import ModalMain from "../ui/mainModal";
import { useModalStore } from "@/store/useModalStore";
import TweetInput from "../TweetInput";

export default function PostReplyModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const data = useModalStore((state) => state.replyData);
  const setData = useModalStore((state) => state.setReplyData);
  useEffect(() => {
    if (!data) {
      modalRef.current?.close();
      return;
    }
    modalRef.current?.showModal();
  }, [data]);

  if (!data) return null;
  return (
    <ModalMain onClose={() => setData(null)} ref={modalRef} headline="Reply">
      <div className="min-h-80 flex items-center">
        <TweetInput
          typeOpenToTop
          replyTo={data.tweetId}
          listKeys={data.listKeys}
        />
      </div>
    </ModalMain>
  );
}
