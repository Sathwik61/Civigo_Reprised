import { Button } from "@/components/ui"

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl">
        <h1 className="mb-1 text-lg font-semibold tracking-tight">Log in</h1>
        <p className="mb-6 text-xs text-slate-400">Access your Civigo workspace.</p>

        <form className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-300">Email</label>
            <input
              type="email"
              className="h-9 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-xs outline-none ring-0 placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-300">Password</label>
            <input
              type="password"
              className="h-9 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-xs outline-none ring-0 placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="mt-2 h-9 w-full text-xs">
            Log in
          </Button>
        </form>
      </div>
    </main>
  )
}
