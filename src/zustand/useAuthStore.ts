import { create } from "zustand";

interface AuthState {
  token: string | null;
  role: string | null;
  isLoggedIn: boolean;
  setAuth: (token: string, role: string | null) => void;
  clearAuth: () => void;
}

// export const useAuthStore = create<AuthState>((set) => ({
//   token: null,
//   role: null,
//   isLoggedIn: false,
//   setAuth: (token, role) =>
//     set(() => ({ token, role , isLoggedIn: true })),
//   clearAuth: () =>
//     set(() => ({ token: null, role: null, isLoggedIn: false })),
// }));


export const useAuthStore = create<AuthState>((set) => {
  // read from localStorage once when the store is created
  let initialToken: string | null = null;
  let initialRole: string | null = null;

  if (typeof window !== "undefined") {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (storedToken) {
      initialToken = storedToken;
    }
    if (storedRole) {
      initialRole = storedRole;
    }
  }

  return {
    token: initialToken,
    role: initialRole,
    isLoggedIn: !!initialToken,
    setAuth: (token, role) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (role) {
          localStorage.setItem("role", role);
        } else {
          localStorage.removeItem("role");
        }
      }
      set(() => ({ token, role, isLoggedIn: true }));
    },
    clearAuth: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
      set(() => ({ token: null, role: null, isLoggedIn: false }));
    },
  };
});