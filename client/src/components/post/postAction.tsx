import { Loader2, LucideIcon } from "lucide-react";
import { useMemo } from "react";

export enum POST_TYPE {
  retweet,
  like,
  save,
}

interface PostActionProps extends React.ComponentPropsWithoutRef<"div"> {
  icon: LucideIcon;
  type?: POST_TYPE;
  children: React.ReactNode;
  loading?: boolean;
  left?: boolean;
  active?: boolean;
  reverse?: boolean;
  className?: string;
}

export default function PostAction({
  loading,
  type,
  left,
  active,
  reverse,
  icon: Icon,
  children,
  className,
  ...props
}: PostActionProps) {
  const activeClass = useMemo(() => {
    switch (type) {
      case POST_TYPE.like:
        return "text-[#EB5757]";
      case POST_TYPE.retweet:
        return "text-[#27AE60]";
      case POST_TYPE.save:
        return "text-primaryBlue";
      default:
        return "text-secondaryGray";
    }
  }, [type]);

  return (
    <div
      {...props}
      className={`flex gap-3 font-noto-sans text-sm py-3 px-2 items-center rounded-lg grow cursor-pointer select-none hover:bg-tertiaryGray active:bg-[#dadada] dark:hover:bg-primaryGray dark:active:bg-secondaryGray ${loading ? "cursor-not-allowed opacity-80 active:bg-transparent hover:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent" : ""} ${left ? "justify-start" : "justify-center"} ${active && !loading ? activeClass : "text-secondaryGray dark:text-tertiaryGray"} ${className ? className : ""}`}
    >
      {!loading && <Icon className={reverse ? "-scale-x-100" : ""} />}
      {!loading ? children : <Loader2 className="animate-spin" />}
    </div>
  );
}
