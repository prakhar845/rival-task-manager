import { create } from 'zustand';
import api from './api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null });
  },
  initialize: async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
      if (token && userString) {
        try {
          const res = await api.get("/auth/me");
          set({ user: res.data, token });
        } catch {
          localStorage.removeItem("token");
          set({ user: null, token: null });
        }
      }
    }
  }
}));
