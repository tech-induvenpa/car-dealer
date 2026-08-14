import { api } from './client'

export function login(email: string, password: string): Promise<{ accessToken: string }> {
  return api.post<{ accessToken: string }>('/auth/login', { email, password })
}
