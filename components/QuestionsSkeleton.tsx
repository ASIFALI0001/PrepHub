export default function QuestionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl px-4 py-4 flex flex-col items-center gap-2">
            <div className="skeleton w-9 h-9 rounded-lg" />
            <div className="skeleton h-5 w-10" />
            <div className="skeleton h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Sections */}
      {[0, 1].map((s) => (
        <div key={s} className="space-y-2.5">
          <div className="flex items-center gap-3 px-1">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-5 w-20 rounded-md" />
          </div>
          {Array.from({ length: 4 }).map((_, q) => (
            <div key={q} className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className="skeleton w-6 h-4" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-16 rounded-md" />
                <div className="skeleton h-4 w-3/4" />
              </div>
              <div className="skeleton w-6 h-6 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
