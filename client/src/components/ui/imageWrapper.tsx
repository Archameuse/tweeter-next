import Image, { ImageProps } from "next/image";

export default function ImageWrapper({
  src,
  alt,
  ...props
}: Partial<ImageProps> & {
  src?: string;
  alt?: string;
}) {
  return (
    <Image
      src={src || "/noprofile.svg"}
      fill
      alt={alt || ""}
      className=""
      draggable={false}
    />
  );
}
