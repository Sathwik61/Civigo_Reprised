import { Link, Outlet } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme"
import { useAuthStore } from "@/zustand/useAuthStore"
import { clearStoredToken } from "@/services/api/login"
export function AppShell() {
    const { theme, toggleTheme } = useTheme()
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-tr from-sky-500 via-sky-400 to-emerald-400 text-xs font-semibold text-white shadow-sm shadow-sky-500/40">
                            CV
                        </div>
                        <Link to="/" className="text-sm font-semibold tracking-tight">
                            Civigo
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="flex items-center gap-1 rounded-full border border-slate-200/70 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[8px] text-white dark:bg-amber-400 dark:text-slate-950">
                                {theme === "dark" ? "☀️" : "🌙"}
                            </span>
                            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"} mode</span>
                        </button>
                        {!isLoggedIn ? (
                            <>
                                <Button asChild variant="outline" size="sm" className="hidden text-xs sm:inline-flex">
                                    <Link to="/login">Log in</Link>
                                </Button>
                                <Button asChild size="sm" className="text-xs">
                                    <Link to="/signup">Get started</Link>
                                </Button>
                            </>
                        ) : (<>
                                 <Button asChild variant="destructive" size="sm" className="hidden text-xs sm:inline-flex">
                                    <Link to="/login" onClick={()=>{useAuthStore.getState().clearAuth();clearStoredToken()}}>Logout</Link>
                                </Button>
                        </>)}
                    </div>
                </div>
            </header>

            <main>
                <Outlet />
            </main>
        </div>
    )
}
