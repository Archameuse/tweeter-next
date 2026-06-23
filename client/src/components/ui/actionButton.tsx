export function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primaryBlue text-white text-xs font-noto-sans py-2 px-6 rounded-md cursor-pointer select-none hover:bg-secondaryBlue active:bg-secondaryBlue active:scale-95 transition-all">
      {children}
    </div>
  );
}
