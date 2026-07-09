export default function PostSkeleton() {
  return (
    <div className="w-xl select-none">
      <div className="w-full p-5 bg-white dark:bg-primaryBlack shadow-md rounded-md flex flex-col gap-5">
        <div>
          <div className="flex h-10 gap-4">
            <SkeletonElement className="h-full aspect-square" />
            <div className="flex flex-col justify-between">
              <SkeletonElement className="w-[20ch] h-lh text-xs" />
              <SkeletonElement className="w-[10ch] h-lh text-xs" />
            </div>
          </div>
        </div>

        <div className="font-noto-sans text-secondaryGray dark:text-white gap-2 flex flex-col">
          <SkeletonElement className="w-full h-lh text-sm" />
          <SkeletonElement className="w-full h-lh text-sm" />
          <SkeletonElement className="w-full h-lh text-sm" />
          <SkeletonElement className="w-full h-lh text-sm" />
        </div>
        <div className="w-full h-96 rounded-md shadow-sm overflow-hidden relative">
          <SkeletonElement className="w-full h-full" />
        </div>
        <ul className="flex text-primaryGray dark:text-tertiaryGray text-xs font-noto-sans justify-end gap-4">
          <SkeletonElement className="w-[12ch] h-lh" />
          <SkeletonElement className="w-[12ch] h-lh" />
          <SkeletonElement className="w-[12ch] h-lh" />
        </ul>
        <div className="p-4 flex gap-4 items-center border-y border-skeletonColor">
          {/* <PostAction icon={MessageSquare}>
            <span className="hidden sm:block">Comments</span>
          </PostAction> */}
          <SkeletonElement className="h-12 grow-8" />
          <SkeletonElement className="h-12 grow-6" />
          <SkeletonElement className="h-12 grow-4" />
          <SkeletonElement className="h-12 grow-4" />
        </div>
      </div>
    </div>
  );
}

function SkeletonElement({ className }: { className?: string }) {
  return (
    <div
      className={`${className ? className : ""} bg-skeletonColor rounded-md animate-pulse`}
    />
  );
}
