const API_URL = import.meta.env.VITE_API_URL as string
const TOKEN_KEY = 'car-dealer-admin-token'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ponytail: AuthContext se registra acá al montar — evita que este módulo
// (plano, sin estado de React) necesite importar el context directamente.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    onUnauthorized?.()
  }

  // varios endpoints void del backend devuelven 200/201 con body vacío, no
  // solo 204 — leer como texto primero evita que res.json() explote en un
  // body vacío (SyntaxError, no ApiError, así que el caller no lo distingue
  // de un fallo real).
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = undefined
  }

  if (!res.ok) {
    const message = (body as { message?: string } | undefined)?.message ?? res.statusText
    throw new ApiError(res.status, message)
  }

  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
}
