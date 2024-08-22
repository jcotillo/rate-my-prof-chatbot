export const StarRatingSkeleton = () => {
  return (
    <div className="flex h-[60px] w-full cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-800 sm:w-[208px]">
      <div className="w-1/3 rounded-md bg-zinc-700 text-transparent">Professor: xxxx</div>
      <div className="w-1/3 rounded-md bg-zinc-700 text-transparent">Rating: xxxxx</div>
      <div className="w-1/3 rounded-md bg-zinc-700 text-transparent">Subject: xxxx</div>
    </div>
  )
}
