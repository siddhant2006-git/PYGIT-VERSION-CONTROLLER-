import { Loader2 } from 'lucide-react'

export default function Spinner({ className = '', size = 18 }) {
  return <Loader2 size={size} className={`animate-spin text-accent-500 ${className}`} />
}

export function PageSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  )
}
