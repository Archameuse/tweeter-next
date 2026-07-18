"use client";
import { useEffect, useRef, useState } from "react";
import ModalMain from "../ui/mainModal";
import { ImageUploadContent } from "./imageUploadModal";
import validateImage from "@/utils/validateImage";
import Cropper, { Area, Point } from "react-easy-crop";
import ImageWrapper from "../ui/imageWrapper";
import { ActionButton, BUTTON_VERSIONS } from "../ui/actionButton";

/**
 *
 * @param maxSize - maxSize in MB for compression
 * @returns
 */
export default function ImageCropModal({
  isOpen,
  onSelect,
  onClose,
  maxSize,
  maxWoH = 128,
}: {
  isOpen: boolean;
  onSelect: (src: File) => void;
  onClose: () => void;
  maxSize?: number;
  maxWoH?: number;
}) {
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleSelectImage = async (file: File) => {
    const { error, localUrl } = await validateImage(file, 2048);
    if (!localUrl) return alert(error);
    if (cropImage && cropImage.startsWith("blob:"))
      URL.revokeObjectURL(cropImage);
    setCropImage(localUrl);
  };
  const discardCrop = () => {
    if (cropImage && cropImage.startsWith("blob:"))
      URL.revokeObjectURL(cropImage);
    setCropImage(null);
  };
  const handleCropImage = () => {
    if (!cropImage || !croppedAreaPixels)
      return alert("No image was selected for cropping");
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return console.log("Something went wrong getting canvas context");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );
      canvas.toBlob((blob) => {
        if (!blob) return console.log("error getting blob from canvas");
        onSelect(new File([blob], "CroppedImage.webp", { type: "image/webp" }));
        setCropImage(null);
      });
    };
    img.onerror = () => {
      console.log("error while loading image");
    };
    img.src = cropImage;
  };

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  useEffect(() => {
    if (!modalRef.current) return;
    if (isOpen) modalRef.current.showModal();
    else modalRef.current.close();
  }, [isOpen]);
  return (
    <ModalMain
      onClose={onClose}
      ref={modalRef}
      headline="Upload image"
      noScroll
    >
      {!cropImage ? (
        <ImageUploadContent
          onSelect={handleSelectImage}
          maxSize={maxSize}
          maxWoH={maxWoH}
        />
      ) : (
        <div className="flex flex-col gap-4 w-full relative">
          <div className="w-full relative">
            <Cropper
              crop={crop}
              onCropChange={setCrop}
              image={cropImage}
              aspect={1}
              minZoom={1}
              maxZoom={4}
              zoom={zoom}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
            <ImageWrapper
              src={cropImage}
              fill={false}
              width={0}
              height={0}
              className="w-full invisible max-h-[75vh]"
            />
          </div>
          <div className="pb-4 w-full flex justify-between px-8">
            <ActionButton
              type="button"
              onClick={discardCrop}
              version={BUTTON_VERSIONS.discard}
            >
              Discard
            </ActionButton>
            <ActionButton type="button" onClick={handleCropImage}>
              Accept
            </ActionButton>
          </div>
        </div>
      )}
    </ModalMain>
  );
}
