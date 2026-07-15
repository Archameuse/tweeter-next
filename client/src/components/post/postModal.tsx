"use client";

import { useEffect, useRef, useState } from "react";
import ModalMain from "../ui/mainModal";
import ImageWrapper from "../ui/imageWrapper";
import { useModalStore } from "@/store/useModalStore";

export default function PostModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const data = useModalStore((state) => state.mediaData);
  const setData = useModalStore((state) => state.setMediaData);
  useEffect(() => {
    if (!data) {
      modalRef.current?.close();
      return;
    }
    modalRef.current?.showModal();
    if (data.isVideo && data.timestamp !== undefined && videoRef.current)
      videoRef.current.currentTime = data.timestamp;
  }, [data]);

  const handleClose = () => {
    setMediaReady(false);
    setData(null, videoRef.current?.currentTime);
  };

  if (!data) return null;
  return (
    <ModalMain onClose={handleClose} ref={modalRef}>
      <div
        className={`w-full grid overflow-hidden transition-[grid-template-rows] ${data.isVideo ? "duration-300" : "duration-150"} ${mediaReady ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden flex items-center justify-center">
          {!data.isVideo ? (
            <ImageWrapper
              src={data.src || "/temp/ (2).jpg"}
              className={`w-full h-auto ${mediaReady ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
              aria-hidden="true"
              role="presentation"
              fill={false}
              width={0}
              height={0}
              sizes="100vw"
              onLoad={() => setMediaReady(true)}
            />
          ) : (
            <video
              src={data.src}
              ref={videoRef}
              onSeeked={() => setMediaReady(true)}
              muted
              loop
              autoPlay
              draggable="false"
              className={`h-full w-full select-none object-center object-cover transition-opacity duration-500 ${mediaReady ? "opacity-100" : "opacity-0"}`}
            ></video>
          )}
        </div>
      </div>
    </ModalMain>
  );
}
