import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const SIZES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

/**
 * Accessible dialog shell shared by every modal in the app.
 *
 * The modals used to be bare fixed-position divs, which meant no Escape key,
 * no click-outside, no focus trap and no announcement to assistive tech —
 * a keyboard or screen-reader user could tab straight out of the dialog into
 * the page behind it. This centralises all of that:
 *   - Escape and backdrop clicks close it
 *   - focus moves in on open and is restored to the trigger on close
 *   - Tab / Shift+Tab cycle inside the panel
 *   - the page behind it can't scroll while it's open
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  description,
  size = 'lg',
  children,
}) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // Remember the trigger so focus can go back where it came from.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement;
    return () => {
      const el = previouslyFocused.current;
      if (el && typeof el.focus === 'function') el.focus();
    };
  }, [isOpen]);

  // Move focus into the dialog once it renders.
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE);
    (first || panel).focus();
  }, [isOpen]);

  // Escape to close, Tab to cycle within the panel.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, onClose]);

  // Don't let the page behind the dialog scroll.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`card w-full ${SIZES[size] || SIZES.lg} my-auto rounded-2xl shadow-2xl overflow-hidden animate-scale-in focus:outline-none`}
      >
        <div className="bg-elevated px-6 py-4 border-b border-line flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon}
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold text-white tracking-tight truncate">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-xs text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-icon text-slate-400 hover:text-white hover:bg-line flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
