import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

const VARIANTS = {
  error: {
    box: 'bg-red-500/10 border-red-500/30 text-red-300',
    icon: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    role: 'alert',
  },
  success: {
    box: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    role: 'status',
  },
  warning: {
    box: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
    role: 'status',
  },
  info: {
    box: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    icon: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
    role: 'status',
  },
};

/**
 * One inline message component for the whole app. Errors, push results and
 * "remote added" confirmations each used to be hand-rolled with slightly
 * different padding, colours and dismiss affordances — and none of them were
 * announced to screen readers.
 */
export default function Alert({
  variant = 'info',
  children,
  onDismiss,
  action,
  className = '',
  mono = false,
}) {
  const style = VARIANTS[variant] || VARIANTS.info;

  return (
    <div
      role={style.role}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-fade-in ${style.box} ${className}`}
    >
      {style.icon}
      <div className={`flex-1 min-w-0 leading-relaxed break-words ${mono ? 'font-mono' : ''}`}>
        {children}
      </div>
      {action}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="btn-icon p-0.5 text-current opacity-60 hover:opacity-100 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
