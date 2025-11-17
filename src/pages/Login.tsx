import { Button } from "@/components/ui"
import { useEffect, useState } from "react";
import { getStoredToken, loginApi } from "@/services/api/login";
import { decodeJwt, getRoleFromJwt, isJwtExpired } from "@/utils/decodeJwt";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/zustand/useAuthStore";

export default function Login() {
    const navigate = useNavigate();
    useEffect(() => {
        const token = getStoredToken();
        if (token && !isJwtExpired(token)) {
            navigate("/projects");
        }
    }, []);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    function handleLogin(event: React.FormEvent) {
        event.preventDefault();
        loginApi({ email, password })
            .then((response) => {
                console.log("Login successful:", response);  
                const decodedJWT:string|null=getRoleFromJwt(response.token);
                useAuthStore.getState().setAuth(response.token, decodedJWT ); 
                isJwtExpired(response.token) ? console.log("Token is expired") : navigate("/projects");
            })
            .catch((error) => {
                console.error("Login failed:", error);
                throw Error("Token Expired", error);
            });

    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-950/80">
                <h1 className="mb-1 text-lg font-semibold tracking-tight">Log in</h1>
                <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">Access your Civigo workspace.</p>

                <form className="space-y-4 text-xs">
                    <div className="space-y-1">
                        <label className="block text-[11px] text-slate-700 dark:text-slate-300">Email</label>
                        <input
                            type="email"
                            className="h-9 w-full rounded-md border border-slate-200/80 bg-white px-3 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[11px] text-slate-700 dark:text-slate-300">Password</label>
                        <input
                            type="password"
                            className="h-9 w-full rounded-md border border-slate-200/80 bg-white px-3 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-white/10 dark:bg-slate-900 dark:placeholder:text-slate-500"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button type="submit" onClick={(event) => handleLogin(event)} className="mt-2 h-9 w-full text-xs">
                        Log in
                    </Button>
                </form>
            </div>
        </main>
    )
}
