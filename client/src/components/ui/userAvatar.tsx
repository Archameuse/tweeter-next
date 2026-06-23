import Image from "next/image";

export function UserAvatar({ src, size }: { src?: string; size: number }) {
  const avatar = src || "/noprofile.svg";

  return (
    <div className="h-full aspect-square rounded-md border border-black dark:border-white overflow-hidden relative">
      <Image
        src={avatar}
        alt="User avatar"
        draggable="false"
        className="object-cover object-center"
        fill
        sizes={`${size}px`}
        loading="eager"
      />
    </div>
  );
}
