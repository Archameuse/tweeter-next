import { LucideIcon } from "lucide-react";

export default function ActionIcon({
  icon: Icon,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      {...props}
      className={`${className ? className + " " : ""}h-full aspect-square cursor-pointer text-primaryBlue hover:text-secondaryBlue active:text-tertiaryBlue`}
    >
      <Icon size="100%" />
    </div>
  );
}
