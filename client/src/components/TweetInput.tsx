"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import UnderlinedText from "./ui/underlinedText";
import {
  Earth,
  Hash,
  Loader2Icon,
  LucideImageOff,
  LucideImagePlus,
  UsersRound,
} from "lucide-react";
import { UserAvatar } from "./ui/userAvatar";
import ActionIcon from "./actionIcon";
import PostAction from "./post/postAction";
import PostImage from "./post/postImage";
import { ActionButton } from "./ui/actionButton";
import ImageUploadModal from "./modals/imageUploadModal";
import validateImage from "@/utils/validateImage";

const MAX_IMAGE_SIZE = 1024 * 1024 * 40; //bytes

export default function TweetInput({ limit = 50 }: { limit?: number }) {
  const [hash, setHash] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messageLoading, setMessageLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string | null>("/temp/ (30).jpg");
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageProgress, setImageProgress] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [chooseType, setChooseType] = useState<boolean>(false);
  const [everyoneCanReply, setEveryoneCanReply] = useState<boolean>(true);
  const user = { image: "/temp/ (2).jpg", username: "TestUser" };
  const replyId = 0;
  const insideClickWrapper = useRef<HTMLDivElement>(null);

  const messageBoxRef = useRef<HTMLDivElement>(null);

  const addHashtag = () => {
    const tag = prompt(
      "Input hashtag (40 characters (only latin letters or numbers))",
    )?.slice(0, 40);
    if (!tag) return setHash(null);
    if (!/^[a-zA-Z0-9]+$/i.test(tag)) return alert("Bad characters found");
    setHash(tag);
  };

  const inputHandler = (e: React.InputEvent<HTMLDivElement>) => {
    setMessage(e.currentTarget.textContent);
    // const divText = e.currentTarget.textContent.slice(0, limit);
    // if (message !== divText) setMessage(divText);
    // if (e.currentTarget.textContent.length <= limit) return;
    // const selection = window.getSelection();
    // const offset = selection?.getRangeAt(0).startOffset || 0;
    // e.currentTarget.textContent = divText;
    // if (selection && e.currentTarget.firstChild) {
    //   const range = document.createRange();
    //   range.setStart(e.currentTarget.firstChild, Math.min(offset, limit));
    //   range.collapse(true);
    //   selection.removeAllRanges();
    //   selection.addRange(range);
    // }
  };
  const clearImage = () => {
    setImage("");
    setImageLoading(false);
    setImageProgress(0);
  };

  const remaining = useMemo(() => limit - message.length, [limit, message]);

  // const pasteHandler = (e: React.ClipboardEvent) => {
  //   // e.preventDefault();
  // };

  const openImageUploadModal = () => {
    setShowModal(true);
  };
  const handleSelectImage = async (file: File) => {
    const { error, localUrl } = await validateImage(file, MAX_IMAGE_SIZE);
    if (!localUrl) return alert(error);
    if (image && image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage(localUrl);
    setShowModal(false);
  };
  const sendTweet = () => {};

  const selectReplyType = (type: boolean) => {
    setEveryoneCanReply(type);
    setChooseType(false);
  };

  useEffect(() => {
    if (!chooseType) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!target || insideClickWrapper.current?.contains(target)) return;
      setChooseType(false);
    };
    document.body.addEventListener("click", handleOutsideClick);
    return () => {
      document.body.removeEventListener("click", handleOutsideClick);
    };
  }, [chooseType]);

  if (!user) return null;
  return (
    <div className="min-w-0 w-full bg-white dark:bg-primaryBlack rounded-lg shadow-sm px-5 py-3 flex flex-col gap-2 relative">
      <UnderlinedText className="flex justify-between flex-wrap [word-break:break-word]">
        {(replyId ? "Reply" : "Tweet something") + (hash ? ` #${hash}` : "")}
        <button
          onClick={addHashtag}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Hash />
        </button>
      </UnderlinedText>
      <div className="min-h-20 h-fit flex gap-4">
        <div className="h-10">
          <UserAvatar size={64} src={user.image} />
        </div>
        <div className="flex flex-col grow items-start min-w-0">
          <div className="w-full grow px-3 py-2 text-sm font-noto-sans rounded-xl">
            <div
              ref={messageBoxRef}
              onInput={inputHandler}
              // onPaste={pasteHandler}
              data-placeholder="What's happening?"
              contentEditable="plaintext-only"
              className={`overflow-y-auto max-h-60 scrollbar-none bg-transparent text-justify focus:outline-none wrap-break-word [hyphens:auto] before:pointer-events-none before:text-[#BDBDBD] focus:before:invisible relative before:absolute before:left-0 ${!message ? "before:content-[attr(data-placeholder)]" : ""} `}
            ></div>
            <span
              className={`float-right ${remaining < 0 ? "text-red-500" : 0}`}
            >
              {remaining}
            </span>
            {image && (
              <div className="w-full relative h-96 rounded-md shadow-sm overflow-hidden mt-8">
                {imageLoading && (
                  <div className="absolute w-full h-full top-0 left-0 z-20 flex flex-col justify-center">
                    <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                      <div
                        className="bg-blue-600 text-xs select-none font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                        style={{ width: imageProgress + "%" }}
                      >
                        {imageProgress}%
                      </div>
                    </div>
                  </div>
                )}
                <div
                  className={`relative h-full ${imageLoading ? "blur-md" : ""}`}
                >
                  <div className="absolute top-0 right-0 z-10 h-8 w-8">
                    <ActionIcon onClick={clearImage} icon={LucideImageOff} />
                  </div>
                  <PostImage src={image} />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between w-full items-center flex-wrap space-y-2">
            <div
              className={`h-6 flex gap-4 text-primaryBlue select-none ${messageLoading ? "pointer-events-none" : ""}`}
            >
              <ActionIcon
                onClick={openImageUploadModal}
                icon={LucideImagePlus}
              />
              <div
                className="h-full flex items-center gap-2"
                ref={insideClickWrapper}
              >
                <div
                  className="h-full"
                  onClick={() => setChooseType((prev) => !prev)}
                >
                  <ActionIcon icon={everyoneCanReply ? Earth : UsersRound} />
                </div>
                <span className="text-xs font-noto-sans">
                  {everyoneCanReply
                    ? "Everyone can reply"
                    : "People you follow"}
                </span>
                {chooseType && (
                  <div className="bg-white dark:bg-primaryBlack px-3 py-2 flex flex-col gap-4 absolute -bottom-2 translate-y-full drop-shadow-md rounded-xl w-64 z-10">
                    <div className="flex flex-col text-xs gap-2">
                      <span className="font-semibold text-primaryBlack dark:text-white">
                        Who can reply?
                      </span>
                      <span className="font-normal font-noto-sans text-primaryGray">
                        Choose who can reply to this Tweet.
                      </span>
                    </div>
                    <PostAction
                      icon={Earth}
                      left
                      onClick={() => selectReplyType(true)}
                    >
                      Everyone
                    </PostAction>
                    <PostAction
                      icon={UsersRound}
                      left
                      onClick={() => selectReplyType(false)}
                    >
                      People you follow
                    </PostAction>
                  </div>
                )}
              </div>
            </div>
            {!messageLoading ? (
              <ActionButton onClick={sendTweet}>Tweet</ActionButton>
            ) : (
              <ActionButton className="cursor-wait opacity-80 scale-100!">
                <Loader2Icon className="animate-spin" />
              </ActionButton>
            )}
          </div>
        </div>
      </div>
      <ImageUploadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleSelectImage}
      />
    </div>
  );
}
