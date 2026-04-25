export default function QuestionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats bar skeleton */}
      <div className="glass-card rounded-2xl border border-bg-border p-5 flex flex-wrap gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bg-border" />
            <div className="w-20 h-4 rounded bg-bg-border" />
          </div>
        ))}
      </div>

      {/* Section skeleton */}
      {[1, 2].map((s) => (
        <div key={s} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-32 h-4 rounded bg-bg-border" />
            <div className="w-16 h-4 rounded bg-bg-border" />
          </div>
          {[1, 2, 3, 4].map((q) => (
            <div
              key={q}
              className="glass-card rounded-xl border border-bg-border p-4 flex items-center gap-4"
            >
              <div className="w-16 h-5 rounded-full bg-bg-border shrink-0" />
              <div className="flex-1 h-4 rounded bg-bg-border" />
              <div className="w-8 h-8 rounded-lg bg-bg-border shrink-0" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
