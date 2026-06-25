import Image, { ImageProps } from "next/image";

export default function ImageWrapper({
  src,
  alt,
  className,
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
      draggable={false}
      className={`object-cover object-center select-none ${className ? className : ""}`}
      sizes="100%"
      {...props}
    />
  );
}
