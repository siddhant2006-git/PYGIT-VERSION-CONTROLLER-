export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-light dark:border-border-dark py-16 px-6 text-center animate-fade-in">
      {Icon && (
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 text-slate-400">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action}
    </div>
  )
}
