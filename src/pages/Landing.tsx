import React from "react"
import { Button } from "@/components/ui"
import { useTheme } from "@/theme"
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export default function Landing() {
  const { theme, toggleTheme } = useTheme()
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      {/* Nav */}
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-sm font-semibold text-primary">
              C
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Civigo</div>
              <div className="text-[11px] text-slate-400">Finance OS for modern teams</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-xs text-slate-300 md:flex">
            <button className="transition-colors hover:text-white">Product</button>
            <button className="transition-colors hover:text-white">Pricing</button>
            <button className="transition-colors hover:text-white">Resources</button>
            <button className="transition-colors hover:text-white">Contact</button>
          </nav>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-slate-900/60 px-2 text-[11px] text-slate-300 shadow-sm transition-colors hover:border-white/30"
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px]"
              >
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
              <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"} mode</span>
            </button>
            <Button variant="ghost" className="h-8 px-3 text-xs">
              Log in
            </Button>
            <Button className="h-8 px-3 text-xs">Get started</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-10%] h-64 w-64 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute right-0 bottom-[-15%] h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-6 py-16 md:py-20">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/20 text-[10px] text-emerald-300">
              ●
            </span>
            <span className="font-medium">New</span>
            <span className="text-slate-300">AI-assisted approvals now live</span>
          </div>

          <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
            <div className="space-y-6">
              <h1 className="max-w-xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Close your books in hours, not weeks.
              </h1>
              <p className="max-w-xl text-sm text-slate-300">
                Civigo centralizes invoices, expenses, and approvals into a single realtime workspace
                so finance teams can move fast without losing control.
              </p>

              <div className="flex flex-wrap gap-3 text-xs">
                <Button className="h-9 px-4 text-xs shadow-[0_10px_30px_rgba(15,23,42,0.7)]">
                  Start free trial
                </Button>
                <Button variant="outline" className="h-9 border-white/15 bg-transparent px-4 text-xs text-slate-100">
                  Book a live demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-[11px] text-slate-400">
                <div>
                  <div className="mb-1 font-medium text-slate-200">2,000+ teams</div>
                  <div>Already automate their month-end with Civigo.</div>
                </div>
                <div className="flex gap-4">
                  <div className="h-7 w-16 rounded-md bg-white/5" />
                  <div className="h-7 w-16 rounded-md bg-white/5" />
                  <div className="h-7 w-16 rounded-md bg-white/5" />
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -right-10 -top-6 hidden h-60 w-60 rounded-3xl bg-linear-to-tr from-primary/40 to-emerald-300/40 blur-2xl md:block" />

              <Card className="relative mx-auto w-full max-w-md border-white/10 bg-white/5 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium text-slate-50">Invoice overview</CardTitle>
                      <CardDescription className="text-[11px] text-slate-300">
                        This quarter · Updated just now
                      </CardDescription>
                    </div>
                    <Button variant="outline" className="h-7 border-white/10 bg-white/5 px-2 text-[11px]">
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="text-slate-300">Unpaid</div>
                      <div className="mt-1 text-sm font-semibold text-slate-50">$1,250</div>
                      <div className="mt-1 text-emerald-300">+18%</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="text-slate-300">Paid</div>
                      <div className="mt-1 text-sm font-semibold text-slate-50">$8,900</div>
                      <div className="mt-1 text-emerald-300">+32%</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="text-slate-300">Overdue</div>
                      <div className="mt-1 text-sm font-semibold text-slate-50">$420</div>
                      <div className="mt-1 text-rose-300">-6%</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-[11px] text-slate-200">
                    <div className="flex items-center justify-between">
                      <span>Approval queue</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                        4 awaiting
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-2/3 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t border-white/5 bg-slate-950/70 px-4 py-3">
                  <div className="text-[11px] text-slate-300">Share a live view with your CFO in one click.</div>
                  <Button variant="outline" className="h-7 border-white/15 bg-transparent px-2 text-[10px]">
                    Open workspace
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features + stats */}
      <section className="border-t border-white/5 bg-slate-950/80">
        <div className="container mx-auto px-6 py-14">
          <div className="mb-10 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end">
            <div>
              <h2 className="text-balance text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
                Built for fast-moving finance teams.
              </h2>
              <p className="mt-2 max-w-xl text-xs text-slate-300">
                Automate recurring tasks, route approvals to the right owners, and keep every
                invoice, receipt, and comment in one place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-200">
              <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-center">
                <div className="text-sm font-semibold">72%</div>
                <div className="mt-1 text-slate-300">faster approvals</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-center">
                <div className="text-sm font-semibold">3x</div>
                <div className="mt-1 text-slate-300">less manual work</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-center">
                <div className="text-sm font-semibold">24/7</div>
                <div className="mt-1 text-slate-300">global support</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-5">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
              <h3 className="text-sm font-medium text-slate-50">Automated workflows</h3>
              <p className="text-xs text-slate-300">
                Build approval rules once and let Civigo handle routing, nudges, and audit trails
                automatically.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-5">
              <div className="h-8 w-8 rounded-full bg-emerald-400/20" />
              <h3 className="text-sm font-medium text-slate-50">Live collaboration</h3>
              <p className="text-xs text-slate-300">
                Comment on line items, mention stakeholders, and keep vendor conversations in
                the same workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-5">
              <div className="h-8 w-8 rounded-full bg-indigo-400/25" />
              <h3 className="text-sm font-medium text-slate-50">Reporting that explains itself</h3>
              <p className="text-xs text-slate-300">
                Share simple, interactive reports that help leaders understand burn, runway, and
                payments at a glance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950">
        <div className="container mx-auto flex flex-col items-center gap-5 px-6 py-6 text-[11px] text-slate-400 md:flex-row md:justify-between">
          <div>© {new Date().getFullYear()} Civigo, Inc.</div>
          <div className="flex gap-4">
            <button className="hover:text-slate-200">Status</button>
            <button className="hover:text-slate-200">Privacy</button>
            <button className="hover:text-slate-200">Terms</button>
          </div>
        </div>
      </footer>
    </main>
  )
}
