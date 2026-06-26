"use client";
import { useEffect, useRef, useState } from "react";
import ModalMain from "../ui/mainModal";
import { ImageUploadContent } from "./imageUploadModal";
import validateImage from "@/utils/validateImage";
import ImageWrapper from "../ui/imageWrapper";

const MIN_SIZE = 64;

enum DIRECTION {
  top,
  left,
  bottom,
  right,
}

export default function ImageCropModal({
  isOpen,
  onSelect,
  onClose,
}: {
  isOpen: boolean;
  onSelect: (src: File) => void;
  onClose: () => void;
}) {
  const [cropImage, setCropImage] = useState<string | null>("/temp/ (8).jpg");
  const modalRef = useRef<HTMLDialogElement>(null);
  const cropWrapperRef = useRef<HTMLDivElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);

  const clickOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const framePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const frameSize = useRef<number>(MIN_SIZE);
  const handleSelectImage = async (file: File) => {
    const { error, localUrl } = await validateImage(file, 1055);
    if (!localUrl) return alert(error);
    if (cropImage && cropImage.startsWith("blob:"))
      URL.revokeObjectURL(cropImage);
    setCropImage(localUrl);
  };
  const discardCrop = () => {
    if (cropImage && cropImage.startsWith("blob:"))
      URL.revokeObjectURL(cropImage);
    setCropImage(null);
    clickOffset.current = { x: 0, y: 0 };
    framePosition.current = { x: 0, y: 0 };
    frameSize.current = MIN_SIZE;
  };
  const handleCropImage = () => {
    if (!cropImage) return alert("No image was selected for cropping");
    //do some kind of crop action
    // onSelect()
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return console.log("Something went wrong getting canvas context");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, 9999, 9999);
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        img.width,
        img.height,
      );
      canvas.toBlob((blob) => {
        if (!blob) return console.log("error getting blob from canvas");
        onSelect(new File([blob], "CroppedImage.webp"));
      });
    };
    img.onerror = () => {
      console.log("error while loading image");
    };
    img.src = cropImage;
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement | HTMLHRElement>,
  ) => {
    e.preventDefault();
    const frame = cropFrameRef.current;
    const wrapper = cropWrapperRef.current;
    if (!wrapper || !frame) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const bounds = wrapper.getBoundingClientRect();
    clickOffset.current = {
      x: e.clientX - bounds.left - framePosition.current.x,
      y: e.clientY - bounds.top - framePosition.current.y,
    };
    frameSize.current = frame.clientWidth;
  };
  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement | HTMLHRElement>,
  ) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (cropFrameRef.current)
      frameSize.current = cropFrameRef.current.clientWidth;
  };

  const handleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const wrapper = cropWrapperRef.current;
    const frame = cropFrameRef.current;
    if (!wrapper || !frame || !e.currentTarget.hasPointerCapture(e.pointerId))
      return;
    const bounds = wrapper.getBoundingClientRect();
    const calcX = e.clientX - bounds.left - clickOffset.current.x;
    const calcY = e.clientY - bounds.top - clickOffset.current.y;
    const maxX = wrapper.clientWidth - frame.clientWidth;
    const maxY = wrapper.clientHeight - frame.clientHeight;
    const newX = Math.min(Math.max(0, calcX), maxX);
    const newY = Math.min(Math.max(0, calcY), maxY);
    framePosition.current = { x: newX, y: newY };
    frame.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
  };

  const handleResize = (
    e: React.PointerEvent<HTMLHRElement>,
    direction: DIRECTION,
  ) => {
    const wrapper = cropWrapperRef.current;
    const frame = cropFrameRef.current;
    if (!wrapper || !frame || !e.currentTarget.hasPointerCapture(e.pointerId))
      return;
    const bounds = wrapper.getBoundingClientRect();

    let newSize;
    let newX = framePosition.current.x;
    let newY = framePosition.current.y;

    // Find the total distance the cursor traveled on the screen since clicking down
    const totalDeltaX = e.clientX - bounds.left - clickOffset.current.x;

    if (direction === DIRECTION.right) {
      const maxSize = Math.min(
        wrapper.clientWidth - framePosition.current.x,
        wrapper.clientHeight - framePosition.current.y,
      );
      // Moving right adds delta directly to the starting frame size
      newSize = Math.min(
        Math.max(MIN_SIZE, frameSize.current + totalDeltaX),
        maxSize,
      );
    } else if (direction === DIRECTION.left) {
      // Find out where the right and bottom edges were locked when we first clicked down
      const initialRightEdge = framePosition.current.x + frameSize.current;
      const initialBottomEdge = framePosition.current.y + frameSize.current;

      // The absolute maximum size before the left or top edges smash into the 0 walls
      const maxSize = Math.min(initialRightEdge, initialBottomEdge);

      // Pulling left (negative totalDeltaX) increases size, so we subtract it
      newSize = Math.min(
        Math.max(MIN_SIZE, frameSize.current - totalDeltaX),
        maxSize,
      );

      // Calculate change relative to where we STARTED the resize action
      const sizeShift = newSize - frameSize.current;

      // Shift left and up relative to our starting position
      newX = initialRightEdge - newSize;
      newY = initialBottomEdge - newSize;
    }
    if (!newSize) return;
    frame.style.width = `${newSize}px`;
    frame.style.height = `${newSize}px`;
    if (newX !== framePosition.current.x || newY !== framePosition.current.y) {
      framePosition.current = { x: newX, y: newY };
      frame.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    }
  };

  useEffect(() => {
    if (!modalRef.current) return;
    if (isOpen) modalRef.current.showModal();
    else modalRef.current.close();
  }, [isOpen]);
  return (
    <ModalMain onClose={onClose} ref={modalRef} headline="Upload image">
      {!cropImage ? (
        <ImageUploadContent onSelect={handleSelectImage} />
      ) : (
        <div className="flex flex-col gap-4 w-full">
          <div
            ref={cropWrapperRef}
            className="relative touch-none overflow-hidden"
          >
            <ImageWrapper
              src={cropImage}
              className="h-full w-full pointer-events-none"
              height={0}
              width={0}
              fill={false}
            />
            {/* <div className="absolute w-full h-full top-0 left-0 bg-black opacity-50"></div> */}
            <div
              ref={cropFrameRef}
              className="absolute aspect-square top-0 left-0  opacity-80 w-1/2 will-change-[left,top] shadow-[0_0_0_9999px] [&>hr]:bg-white"
            >
              <div
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={handleDrag}
                className="cursor-move h-full w-full absolute top-0 left-0"
              ></div>
              <hr
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={(e) => handleResize(e, DIRECTION.left)}
                className="cursor-ew-resize absolute top-0 left-0 h-full w-2 border-x border-y border-dashed"
              />
              <hr
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={(e) => handleResize(e, DIRECTION.right)}
                className="cursor-ew-resize absolute top-0 right-0 h-full w-2 border-x border-y border-dashed"
              />
              <hr
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={(e) => handleResize(e, DIRECTION.top)}
                className="cursor-ns-resize absolute top-0 left-0 h-2 w-full border-x border-y border-dashed"
              />
              <hr
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={(e) => handleResize(e, DIRECTION.bottom)}
                className="cursor-ns-resize absolute bottom-0 h-2 w-full border-x border-y border-dashed"
              />
            </div>
          </div>
          <div className="pb-4 w-full flex justify-between px-8">
            <button
              onClick={discardCrop}
              className="inline-block rounded bg-primaryBlue px-6 py-2 text-xs font-medium uppercase leading-normal text-white shadow-sm transition duration-150 ease-in-out hover:bg-secondaryBlue hover:shadow-md focus:bg-primary-accent-300 focus:shadow-primary-2 focus:outline-none focus:ring-0 active:opacity-80 active:shadow-sm active:transition-none"
            >
              Discard
            </button>
            <button
              onClick={handleCropImage}
              className="inline-block rounded bg-primaryBlue px-6 py-2 text-xs font-medium uppercase leading-normal text-white shadow-sm transition duration-150 ease-in-out hover:bg-secondaryBlue hover:shadow-md focus:bg-primary-accent-300 focus:shadow-primary-2 focus:outline-none focus:ring-0 active:opacity-80 active:shadow-sm active:transition-none"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </ModalMain>
  );
}
