import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createCookieStorage } from './middleware/cookie-storage';

interface UserSession {
  userId: string | null;
  username: string | null;
  name: string | null;
}

interface UserActions {
  setUser: (user: UserSession) => void;
  clearUser: () => void;
}

const initialState: UserSession = {
  userId: null,
  username: null,
  name: null,
};

export const useUserStore = create<UserSession & UserActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setUser: (user) => set(user),
        clearUser: () => set(initialState),
      }),
      {
        name: 'user',
        storage: createCookieStorage({ maxAge: 60 * 60 * 24 * 7 }), // 7 days
        partialize: ({ userId, username, name }) => ({ userId, username, name }),
      },
    ),
    { name: 'UserStore' },
  ),
);
