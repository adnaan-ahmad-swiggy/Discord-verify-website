export default function SuccessPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Verification Successful
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          You now have access to Swiggy Builders Club. Head back to Discord to explore the community.
        </p>
        <a
          href="https://discord.com/channels/@me"
          className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Open Discord
        </a>
      </div>
    </div>
  );
}
