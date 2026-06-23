export function PageContainer({
  children,
  ref,
}: {
  children: React.ReactNode;
  ref?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={ref}
      className="overflow-y-scroll h-[calc(100vh-4rem)] w-screen dark:text-white"
    >
      <div className="flex flex-col lg:flex-row gap-6 max-w-5xl w-full m-auto py-4">
        {children}
      </div>
    </div>
  );
}
