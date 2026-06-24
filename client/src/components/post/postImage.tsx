import { useMemo, useRef, useState } from "react";
import ImageWrapper from "../ui/imageWrapper";

const isVideo = (link?: string): boolean => {
  if (!link) return false;
  const videoRegex = /\.(webm|mp4)$/i;
  return videoRegex.test(link);
};
export default function PostImage({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [timestamp, setTimestamp] = useState(0);
  // const [showModal, setShowModal] = useState(false);
  const click = () => {
    if (video.current) {
      video.current.pause();
      setTimestamp(video.current.currentTime);
    }
    // setShowModal(true);
  };
  const isVideo = useMemo(() => /\.(webm|mp4)($|\?)/i.test(src), [src]);
  return (
    <>
      {!isVideo ? (
        <ImageWrapper onClick={click} src={src} />
      ) : (
        <video
          ref={video}
          src={src}
          onClick={click}
          muted
          loop
          autoPlay
          draggable="false"
          className="h-full w-full select-none object-center object-cover"
        ></video>
      )}
    </>
  );
}
