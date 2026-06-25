export function ActionButton({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      {...props}
      className={`bg-primaryBlue text-white text-xs font-noto-sans py-2 px-6 rounded-md cursor-pointer select-none hover:bg-secondaryBlue active:bg-secondaryBlue active:scale-95 transition-all ${className ? className : ""}`}
    >
      {children}
    </div>
  );
}
