import { create } from 'zustand';

type AuthState = { token?: string; setToken: (t?: string) => void };
export const useAuth = create<AuthState>(set => ({
  token: undefined,
  setToken: (t) => set({ token: t })
}));
