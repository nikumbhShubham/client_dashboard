import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  user_id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  city?: string;
  state?: string;
  country?: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Dummy default user for testing if needed
const DUMMY_USER: User = {
    user_id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    is_active: true
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DUMMY_USER, // Default to dummy user for frontend demo
      token: 'dummy-token',
      isAuthenticated: true, // Default to true for frontend demo
      
      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      clearAuth: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
