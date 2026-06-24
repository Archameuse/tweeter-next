import { useEffect, useMemo, useRef } from "react";
import ImageWrapper from "../ui/imageWrapper";
import { useModalStore } from "../../../store/useModalStore";

export default function PostImage({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const isVideo = useMemo(() => /\.(webm|mp4)($|\?)/i.test(src), [src]);
  const setModal = useModalStore((state) => state.setMediaData);
  const data = useModalStore((state) => state.mediaData);
  const modalTimestamp = useModalStore((state) => state.modalTimestamp);
  // const [showModal, setShowModal] = useState(false);
  const click = () => {
    if (video.current) {
      video.current.pause();
    }
    setModal({
      src,
      isVideo,
      timestamp: video.current?.currentTime,
    });
  };

  useEffect(() => {
    if (!video.current) return;
    if (!data && video.current.paused) {
      if (modalTimestamp || modalTimestamp === 0)
        video.current.currentTime = modalTimestamp;
      video.current.play();
    } else if (data) video.current.pause();
  }, [data, modalTimestamp]);
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
