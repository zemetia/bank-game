'use client';

import { useUserStore } from '@/stores';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks';

LogoutButton.displayName = 'LogoutButton';

export function LogoutButton() {
  const { clearUser } = useUserStore();
  const { clearSession } = useGameStore();
  const toast = useToast();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearUser();
    clearSession();
    toast.success('Signed out');
    window.location.replace('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-foreground-subtle hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}
