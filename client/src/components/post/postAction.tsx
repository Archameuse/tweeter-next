import { Loader2, LucideIcon } from "lucide-react";
import React, { useMemo } from "react";

/**
 * SHOULD MATCH API ENDPOINTS
 */
export enum POST_ACTION {
  retweet = "retweets",
  like = "likes",
  save = "saves",
}

interface PostActionProps extends React.ComponentPropsWithoutRef<"button"> {
  icon: LucideIcon;
  action?: POST_ACTION;
  loading?: boolean;
  left?: boolean;
  active?: boolean;
  reverse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function PostAction({
  action,
  left,
  active,
  reverse,
  icon: Icon,
  className,
  children,
  ...props
}: PostActionProps) {
  const activeClass = useMemo(() => {
    switch (action) {
      case POST_ACTION.like:
        return "text-[#EB5757]";
      case POST_ACTION.retweet:
        return "text-[#27AE60]";
      case POST_ACTION.save:
        return "text-primaryBlue";
      default:
        return "text-secondaryGray";
    }
  }, [action]);

  return (
    <button
      {...props}
      className={`
        flex gap-3 font-noto-sans text-sm py-3 px-2 items-center rounded-lg grow cursor-pointer select-none hover:bg-tertiaryGray active:bg-[#dadada] dark:hover:bg-primaryGray dark:active:bg-secondaryGray 
        disabled:pointer-events-none disabled:opacity-40 
        ${left ? "justify-start" : "justify-center"} 
        ${active ? activeClass : ""} 
        ${className ? className : ""}
        `}
    >
      <Icon className={reverse ? "-scale-x-100" : ""} />
      {children}
    </button>
  );
}
// }${loading ? "cursor-not-allowed opacity-80 active:bg-transparent hover:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent" : ""}
// text-secondaryGray dark:text-tertiaryGray

// {!loading ? children : <Loader2 className="animate-spin" />}
