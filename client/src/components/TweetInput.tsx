"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import UnderlinedText from "./ui/underlinedText";
import {
  Earth,
  Hash,
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
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@/providers/UserProvider";
import axios, { AxiosError } from "axios";
import { ACTUAL_API_URL, fetchUploadToken } from "@/utils/userHelpers";
import { ImageLoadbar } from "@/app/settings/feed";
import { TWEET_LIST_KEY } from "./post/postMain";
import { useModalStore } from "@/store/useModalStore";

const MAX_IMAGE_SIZE = 1024 * 1024 * 20; //bytes

export default function TweetInput({
  limit = 150,
  typeOpenToTop,
  replyTo,
  listKeys,
}: {
  listKeys: TWEET_LIST_KEY[];
  limit?: number;
  typeOpenToTop?: boolean;
  replyTo?: string;
}) {
  const { user } = useUser();
  const [hash, setHash] = useState<string | null>(null);
  const [message, setMessage] = useState<string>(""); // have to keep useState logic for the reactive limit handling
  const [image, setImage] = useState<string | null>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageProgress, setImageProgress] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [chooseType, setChooseType] = useState<boolean>(false);
  const [everyoneCanReply, setEveryoneCanReply] = useState<boolean>(true);
  const insideClickWrapper = useRef<HTMLDivElement>(null);
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const setReplyData = useModalStore((state) => state.setReplyData);

  const { mutate, isPending } = useMutation({
    mutationFn: async (newTweet: TweetInput) => {
      const formData = new FormData();
      formData.append("tweet", JSON.stringify(newTweet));
      if (imageFile) {
        formData.append("image", imageFile);
      }
      const { data: uploadToken, error: uploadTokenError } =
        await fetchUploadToken();
      if (uploadTokenError || !uploadToken)
        throw new AxiosError(
          uploadTokenError || "Unknown error while fetching token",
        );
      const res = await axios.post<TweetResponse>(
        `${ACTUAL_API_URL}/tweets`,
        formData,
        {
          headers: {
            // Authorization: `Bearer ${uploadToken}`,
            ...uploadToken,
          },
          onUploadProgress: (progress) => {
            if (progress.progress) {
              setImageProgress(Math.floor(progress.progress * 100));
            }
          },
        },
      );
      return res.data;
    },
    onMutate: async (newTweet) => {
      const prevDataList: {
        key: readonly unknown[];
        data: InfiniteData<PaginationResponse<Tweet[]>, unknown> | undefined;
      }[] = [];
      const tempId = replyTo ? null : crypto.randomUUID();
      for (const listKey of listKeys) {
        await queryClient.cancelQueries({ queryKey: [listKey], exact: false });
        const [[prevKey, prevData]] = queryClient.getQueriesData<
          InfiniteData<PaginationResponse<Tweet[]>>
        >({ queryKey: [listKey], exact: false });
        if (replyTo) {
          queryClient.setQueriesData<InfiniteData<PaginationResponse<Tweet[]>>>(
            { queryKey: [listKey], exact: false },
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((t) =>
                    t.id === replyTo
                      ? {
                          ...t,
                          replies: t.replies + 1,
                        }
                      : t,
                  ),
                })),
              };
            },
          );
        } else if (tempId) {
          queryClient.setQueriesData<InfiniteData<PaginationResponse<Tweet[]>>>(
            { queryKey: [listKey], exact: false },
            (old) => {
              if (!old || !user || !old.pages.length) return old;
              const nextPages = [...old.pages];
              nextPages[0] = {
                ...nextPages[0],
                data: [
                  {
                    author: user,
                    content: newTweet.content,
                    created_at: new Date(),
                    id: tempId,
                    likes: 0,
                    replies: 0,
                    retweets: 0,
                    saves: 0,
                    hashtag: newTweet.hashtag,
                    image: image,
                    inProgress: true,
                  },
                  ...nextPages[0].data,
                ],
              };
              return {
                ...old,
                pages: nextPages,
              };
            },
          );
        }
        prevDataList.push({ key: prevKey, data: prevData });
      }
      return { prevDataList, tempId };
    },
    onSettled: () => {
      setImageProgress(0);
    },
    onSuccess: (response, _variables, context) => {
      setImage(null);
      setImageFile(null);
      setHash(null);
      setMessage("");
      if (messageBoxRef.current) messageBoxRef.current.innerText = "";
      if (replyTo) {
        alert("Reply was successful");
        setReplyData(null);
      } else if (response?.tweet && context?.prevDataList && context?.tempId) {
        for (const { key } of context.prevDataList) {
          queryClient.setQueriesData<InfiniteData<PaginationResponse<Tweet[]>>>(
            { queryKey: key, exact: false },
            (old) => {
              if (!old || !user || !old.pages.length) return old;
              const nextPages = [...old.pages];
              nextPages[0] = {
                ...nextPages[0],
                data: nextPages[0].data.map((tweet) =>
                  context.tempId === tweet.id ? response.tweet : tweet,
                ),
              };
              return {
                ...old,
                pages: nextPages,
              };
            },
          );
        }
      }
    },
    onError: (err, _variables, context) => {
      if (context?.prevDataList) {
        for (const { key, data } of context.prevDataList) {
          queryClient.setQueriesData({ queryKey: key, exact: false }, data);
        }
      }
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) {
          console.error(err);
          return alert(err.response?.data?.message);
        }
      }
      return alert("Unknown error");
    },
  });

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
    if (image && image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage("");
    setImageFile(null);
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
    setImageFile(file);
    setShowModal(false);
  };
  const sendTweet = () => {
    if (message.length < 1) {
      return alert("Message can't be empty");
    }
    if (message.length > limit) {
      return alert(`Message should be less than ${limit} characters`);
    }
    const newTweet: TweetInput = {
      content: message,
      onlyFollowers: !everyoneCanReply,
      ...(hash && { hashtag: hash }),
      ...(replyTo && { replyTo: replyTo }),
    };

    mutate(newTweet);
  };

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
        {(replyTo ? "Reply" : "Tweet something") + (hash ? ` #${hash}` : "")}
        <button
          onClick={addHashtag}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Hash />
        </button>
      </UnderlinedText>
      <div className="min-h-20 h-fit flex gap-4">
        <div className="h-10">
          <UserAvatar size={64} src={user.avatar} />
        </div>
        <div className="flex flex-col grow items-start min-w-0">
          <div className="w-full grow px-3 py-2 text-sm font-noto-sans rounded-xl">
            <div
              ref={messageBoxRef}
              onInput={inputHandler}
              // onPaste={pasteHandler}
              data-placeholder="What's happening?"
              contentEditable={isPending ? "false" : "plaintext-only"}
              className={`overflow-y-auto max-h-60 min-h-5 scrollbar-none bg-transparent text-justify focus:outline-none wrap-break-word [hyphens:auto] before:pointer-events-none before:text-[#BDBDBD] focus:before:invisible relative before:absolute before:left-0 ${!message ? "before:content-[attr(data-placeholder)]" : ""} `}
            ></div>
            <span
              className={`float-right ${remaining < 0 ? "text-red-500" : 0}`}
            >
              {remaining}
            </span>
            {image && (
              <div className="w-full relative h-96 rounded-md shadow-sm overflow-hidden mt-8">
                <ImageLoadbar progress={imageProgress} />
                <div
                  className={`relative h-full ${imageProgress > 0 ? "blur-md" : ""}`}
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
              className={`h-6 flex gap-4 text-primaryBlue select-none ${isPending ? "pointer-events-none opacity-60" : ""}`}
            >
              <ActionIcon
                onClick={openImageUploadModal}
                icon={LucideImagePlus}
              />
              <div
                className="h-full flex items-center gap-2 relative"
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
                  <div
                    className={`bg-white dark:bg-primaryBlack px-3 py-2 flex flex-col gap-4 absolute drop-shadow-md rounded-xl w-64 z-10 ${typeOpenToTop ? "-top-2 -translate-y-full" : "-bottom-2 translate-y-full"}`}
                  >
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
            <ActionButton onClick={sendTweet} disabled={isPending}>
              Tweet
            </ActionButton>
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
