import { ComponentProps } from "react";

export function SectionFragment({
  active,
  children,
  ...rest
}: ComponentProps<"div"> & {
  active?: boolean;
}) {
  return (
    <div
      {...rest}
      className={`h-8 flex items-center font-semibold text-sm relative px-5 cursor-pointer select-none ${active ? "text-primaryBlue dark:brightness-150 before:w-1 before:h-full before:bg-primaryBlue before:absolute before:left-0 before:rounded-r-md" : "text-primaryGray dark:text-white"}`}
    >
      {children}
    </div>
  );
}
