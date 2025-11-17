import { Navigate, Outlet } from "react-router-dom";
import { isJwtExpired } from "@/utils/decodeJwt";
import { getStoredToken } from "@/services/api/login";

export default function RequireAuth() {
  const token = getStoredToken();

  // If token missing or expired → redirect
  if (!token || isJwtExpired(token)) {
    return <Navigate to="/login" replace />;
  }

  // Token valid → render nested routes
  return <Outlet />;
}
