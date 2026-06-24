import ImageWrapper from "../ui/imageWrapper";

export default function PostImage({ src }: { src: string }) {
  const click = () => {};
  return <ImageWrapper onClick={click} src={src} />;
}
