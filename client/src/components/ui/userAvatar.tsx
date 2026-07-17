import Image from "next/image";

export function UserAvatar({
  src,
  size,
  isAboveFold,
}: {
  size: number;
  src?: string | null;
  isAboveFold?: boolean;
}) {
  const avatar = src || "/noprofile.svg";

  return (
    <div className="h-full aspect-square rounded-md border border-skeletonColor overflow-hidden relative">
      <Image
        src={avatar}
        alt="User avatar"
        draggable="false"
        className="object-cover object-center"
        fill
        sizes={`${size}px`}
        loading={isAboveFold ? "eager" : "lazy"}
        preload={isAboveFold}
      />
    </div>
  );
}
