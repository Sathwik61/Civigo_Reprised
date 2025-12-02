export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null; // SSR safety
  return localStorage.getItem("token");
}

// export function getStoredRole(): string | null {
//   if (typeof window === "undefined") return null;
//   return localStorage.getItem("role");
// }