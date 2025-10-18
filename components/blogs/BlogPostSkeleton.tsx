export default function BlogPostSkeleton() {
  return (
    <div className="mx-auto w-full px-0 sm:px-4 lg:px-8">
      <div className="xl:flex xl:justify-center xl:gap-20">
        <div className="hidden w-[260px] shrink-0 xl:block" aria-hidden="true" />

        <div className="mx-auto w-full max-w-3xl animate-pulse space-y-10 rounded-3xl bg-transparent lg:max-w-4xl xl:mx-0">
          <header className="space-y-4">
            <div className="bg-muted/70 h-10 w-3/4 rounded-lg sm:h-12" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <span
                  key={index}
                  className="bg-muted/50 h-6 w-20 rounded-full sm:h-7 sm:w-24"
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="bg-muted/50 h-4 w-32 rounded sm:w-40" />
              <span className="bg-muted/40 h-4 w-24 rounded sm:w-32" />
            </div>
            <div className="bg-muted/50 h-5 w-full max-w-2xl rounded sm:h-6" />
            <div className="bg-muted/40 h-48 w-full rounded-3xl sm:h-64" />
          </header>

          <section className="space-y-6">
            {Array.from({ length: 6 }).map((_, paragraphIndex) => (
              <div
                key={paragraphIndex}
                className="space-y-3 sm:space-y-4 md:w-11/12 lg:w-full"
              >
                <div className="bg-muted/50 h-4 w-full rounded" />
                <div className="bg-muted/50 h-4 w-11/12 rounded" />
                <div className="bg-muted/40 h-4 w-5/6 rounded" />
              </div>
            ))}
          </section>
        </div>

        <aside className="relative hidden w-[260px] shrink-0 xl:block">
          <div className="sticky top-28">
            <div className="border-border/60 bg-card/60 space-y-3 rounded-3xl border p-5 shadow-sm">
              <div className="bg-muted/60 h-3 w-24 rounded" />
              <ul className="space-y-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <li key={index} className="bg-muted/40 h-3 w-full rounded" />
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 space-y-4 xl:hidden">
        <div className="bg-muted/60 h-3 w-20 rounded" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className="bg-muted/40 h-4 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
