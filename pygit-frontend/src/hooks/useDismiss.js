import { useEffect, useRef } from 'react';

/**
 * Closes a popover when the user clicks outside it or presses Escape, and
 * returns focus to the trigger on Escape. The dropdowns previously handled
 * click-outside only, so a keyboard user who opened the branch picker had no
 * way to close it without tabbing through every option.
 *
 * Returns a ref to attach to the popover's outermost element.
 */
export function useDismiss(isOpen, onDismiss, triggerRef) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onDismiss();
      }
    };

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onDismiss();
      triggerRef?.current?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onDismiss, triggerRef]);

  return containerRef;
}
