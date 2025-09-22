import { create } from 'zustand';

export type AuthState = {
  token?: string;
  setToken: (t?: string) => void;
};

export const useAuth = create<AuthState>((set) => ({
  token: undefined,
  setToken: (t?: string) => set({ token: t }),
}));
