export const ReviewSkeleton = () => {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-green-400">
      <div className="float-right inline-block w-fit rounded-full bg-zinc-700 px-2 py-1 text-xs text-transparent">
        Rating: xxxxx
      </div>
      <div className="mb-1 w-fit rounded-md bg-zinc-700 text-lg text-transparent">
        Professor: xxxx
      </div>
      <div className="w-fit rounded-md bg-zinc-700 text-3xl font-bold text-transparent">
        Subject: xxxx
      </div>
      <div className="text mt-1 w-fit rounded-md bg-zinc-700 text-xs text-transparent">
        Review: xxxxxx xxx xx xxxx xx xxx
      </div>

      <div className="relative -mx-4 cursor-col-resize">
        <div style={{ height: 146 }}></div>
      </div>
    </div>
  )
}