export enum BUTTON_VERSIONS {
  default,
  green,
  discard,
}

export function ActionButton({
  children,
  className,
  version = BUTTON_VERSIONS.default,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  className?: string;
  version?: BUTTON_VERSIONS;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`
        ${className ? className : ""}
        ${
          version === BUTTON_VERSIONS.default
            ? "text-white py-2 px-6 bg-primaryBlue hover:bg-secondaryBlue active:bg-secondaryBlue text-xs"
            : version === BUTTON_VERSIONS.green
              ? "text-white bg-green-600 hover:bg-green-800 active:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5"
              : version === BUTTON_VERSIONS.discard
                ? "text-red-700 hover:text-white border border-red-700 hover:bg-red-800 active active:bg-red-700 px-5 py-2.5 text-sm"
                : ""
        } 
        font-noto-sans rounded-md cursor-pointer select-none disabled:opacity-60 disabled:pointer-events-none active:scale-95 transition-all`}
    >
      {children}
    </button>
  );
}
