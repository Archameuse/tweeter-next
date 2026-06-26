"use client";
import { useEffect, useRef } from "react";
import ModalMain from "../ui/mainModal";
import Image from "next/image";
import { ActionButton } from "../ui/actionButton";

const imageType = /^image\//;

export default function ImageUploadModal({
  isOpen,
  onSelect,
  onClose,
}: {
  isOpen: boolean;
  onSelect: (file: File) => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!modalRef.current) return;
    if (isOpen) modalRef.current.showModal();
    else modalRef.current.close();
  }, [isOpen]);
  return (
    <ModalMain onClose={onClose} ref={modalRef} headline="Upload image">
      <ImageUploadContent onSelect={onSelect} />
    </ModalMain>
  );
}

export function ImageUploadContent({
  onSelect,
}: {
  onSelect: (e: File) => void;
}) {
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const dropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return alert("No file selected");
    if (!imageType.test(file.type)) return alert("File is not an image");
    onSelect(file);
  };
  const selectImage = () => {
    if (!fileInputRef.current) return;
    const file = fileInputRef.current.files?.[0];
    fileInputRef.current.value = "";
    if (!file) return alert("No image selected");
    if (!imageType.test(file.type)) return alert("File is not an image");
    onSelect(file);
  };
  return (
    <main
      onDrop={dropImage}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => e.preventDefault()}
      className="bg-white dark:bg-primaryBlack flex flex-col justify-center items-center w-full shadow-md rounded-lg text-center p-4"
    >
      <div>
        <h1 className="text-black/60 dark:text-tertiaryGray">
          Upload your image
        </h1>
        <h3 className="text-black/40 dark:text-tertiaryGray">
          File should be an image
        </h3>
      </div>
      <div
        ref={dropzoneRef}
        className="w-[90%] flex flex-col items-center justify-center border-dashed border-2 border-sky-300 bg-sky-50 dark:border-tertiaryGray dark:bg-secondaryGray rounded-[5px] text-black/20 py-16 overflow-hidden"
      >
        <Image
          className="overflow-hidden h-25 w-50"
          src="/image.svg"
          height={100}
          width={200}
          alt=""
          role="presentation"
          loading="eager"
          aria-hidden
        />
        <h2 className="text-black/65 dark:text-tertiaryGray mt-0 mb-6 w-full">
          Drag & Drop your image in here
        </h2>
        <div>
          <h2 className="text-black/30 dark:text-white text-sm">Or</h2>
        </div>
        <ActionButton className="text-xl! my-4" onClick={manualSelect}>
          Choose a file
        </ActionButton>
      </div>
      <input
        onChange={selectImage}
        className="hidden"
        type="file"
        ref={fileInputRef}
        accept="image/*"
      />
    </main>
  );
}
