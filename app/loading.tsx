export default async function Loading() {
  return (
    <div className="min-h-[70vh] bg-background">
      <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-5 py-12">
        <div className="space-y-8">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
