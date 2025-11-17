import { Button } from "@/components/ui"

export default function Signup() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-950/80">
        <h1 className="mb-1 text-lg font-semibold tracking-tight">Create account</h1>
        <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">Start your first Civigo workspace.</p>

        <form className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              className="h-9 w-full rounded-md border border-slate-200/80 bg-white px-3 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
              placeholder="Alex Doe"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              className="h-9 w-full rounded-md border border-slate-200/80 bg-white px-3 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              className="h-9 w-full rounded-md border border-slate-200/80 bg-white px-3 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
              placeholder="Create a strong password"
            />
          </div>

          <Button type="submit" className="mt-2 h-9 w-full text-xs">
            Create account
          </Button>
        </form>
      </div>
    </main>
  )
}
