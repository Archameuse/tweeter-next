import { X } from "lucide-react";
import { Ref } from "react";

export default function ModalMain({
  ref,
  children,
  headline,
  onClose,
  noScroll,
}: {
  ref: Ref<HTMLDialogElement>;
  headline: string;
  onClose: () => void;
  children: React.ReactNode;
  noScroll?: boolean;
}) {
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="w-full max-w-2xl rounded-lg bg-transparent p-0 m-auto backdrop:bg-black/50 open:flex open:flex-col justify-center overflow-hidden"
    >
      <div className="flex flex-col relative h-full min-h-0 bg-white dark:bg-primaryBlack rounded-lg shadow">
        <div className="flex justify-between items-start p-4 rounded-t border-b shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white shrink-0">
            {headline}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          >
            <X className="size-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        <div className={noScroll ? "overflow-y-hidden" : "overflow-y-auto"}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
