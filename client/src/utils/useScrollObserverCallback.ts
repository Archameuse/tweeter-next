import { useCallback, useEffect, useRef } from "react";

/**
 *
 * @param callback function to be called when target ref is scrolled into vew
 * @param preTrigger root margin to pre trigger event in px
 * @param root defaults to browser viewport but can specify scrollable viewport for modals e.g.
 * @returns ref (callback function) that is to be passed to component ref that would trigger callback when scrolled into view
 */
export default function useScrollObserverCallback(
  callback: () => void,
  {
    rootRef,
    preTrigger = 0,
  }: {
    rootRef?: React.RefObject<HTMLElement | null> | null;
    preTrigger?: number;
  } = {},
) {
  const callbackRef = useRef(callback);
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  const targetRef = useCallback(
    (target: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      const root = rootRef && rootRef.current ? rootRef.current : null;
      if (!target) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            callbackRef.current();
          }
        },
        { root, rootMargin: `${preTrigger}px` },
      );
      observerRef.current.observe(target);
    },
    [preTrigger, rootRef],
  );
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);
  return targetRef;
}
