export interface JwtPayload {
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

export function getJwtExpiration(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") {
    return null;
  }
  return payload.exp;
}

export function getRoleFromJwt(token: string): string | null {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.role !== "string") {
    return null;
  }
  return payload.role;
}

export function isJwtExpired(token: string): boolean {
  try {
    const payload = decodeJwt(token);

    // If payload or exp is missing → treat as expired
    if (!payload || typeof payload.exp !== "number") {
      return true;
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    return payload.exp < currentTimeInSeconds;
  } catch (err) {
    return true; // Invalid token = expired
  }
}
