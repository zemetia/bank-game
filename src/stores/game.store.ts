import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createCookieStorage } from './middleware/cookie-storage';

interface GameSession {
  roomCode: string | null;
  userId: string | null;
  isMaster: boolean;
}

interface GameActions {
  setSession: (session: GameSession) => void;
  clearSession: () => void;
}

const initialState: GameSession = {
  roomCode: null,
  userId: null,
  isMaster: false,
};

export const useGameStore = create<GameSession & GameActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setSession: (session) => set(session),
        clearSession: () => set(initialState),
      }),
      {
        name: 'game',
        storage: createCookieStorage({ maxAge: 60 * 60 * 24 }), // 24 h
        partialize: ({ roomCode, userId, isMaster }) => ({ roomCode, userId, isMaster }),
      },
    ),
    { name: 'GameStore' },
  ),
);
