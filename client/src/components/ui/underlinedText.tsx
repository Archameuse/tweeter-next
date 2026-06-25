export default function UnderlinedText({
  children,
  className,
  ...props
}: Readonly<
  React.ComponentPropsWithoutRef<"span"> & {
    children?: React.ReactNode;
    className?: string;
  }
>) {
  return (
    <span
      {...props}
      className={`py-2 border-b border-[#E0E0E0] text-secondaryGray dark:text-white font-semibold text-xs ${className ? className : ""}`}
    >
      {children}
    </span>
  );
}
