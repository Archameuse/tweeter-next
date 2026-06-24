import { useEffect, useRef } from "react";
import ModalMain from "../ui/mainModal";
import ImageWrapper from "../ui/imageWrapper";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function PostModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  //   const searchParams = useSearchParams()
  //   const isOpen = searchParams.has('modal')
  useEffect(() => {
    modalRef.current?.showModal();
  }, []);
  return (
    <ModalMain headline="headline" onClose={() => {}} ref={modalRef}>
      <ImageWrapper
        src={"/temp/ (2).jpg"}
        className="w-full h-auto"
        aria-hidden="true"
        role="presentation"
        fill={false}
        width={0}
        height={0}
        sizes="100vw"
      />
    </ModalMain>
  );
}
