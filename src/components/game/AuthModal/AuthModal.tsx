'use client';

import { useState } from 'react';
import { useToast } from '@/hooks';
import { useUserStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserVO } from '@/types/value-objects';

type Tab = 'login' | 'register';

interface Props {
  open: boolean;
  onClose: () => void;
}

AuthModal.displayName = 'AuthModal';

export function AuthModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const { setUser } = useUserStore();
  const toast = useToast();

  function handleSuccess(user: UserVO) {
    setUser({ userId: user.id, username: user.username, name: user.name });
    toast.success(`Welcome, ${user.name}!`);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-[--color-border] bg-[--color-surface] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[--color-border] px-6 pt-5 pb-4">
          <div className="flex gap-1">
            <TabButton active={tab === 'login'} onClick={() => setTab('login')}>Sign In</TabButton>
            <TabButton active={tab === 'register'} onClick={() => setTab('register')}>Register</TabButton>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[--color-foreground-muted] transition-colors hover:bg-[--color-surface-raised] hover:text-[--color-foreground]"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          {tab === 'login'
            ? <LoginForm onSuccess={handleSuccess} />
            : <RegisterForm onSuccess={handleSuccess} />
          }
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[--color-primary] text-[--color-primary-foreground]'
          : 'text-[--color-foreground-muted] hover:text-[--color-foreground]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

TabButton.displayName = 'TabButton';

function LoginForm({ onSuccess }: { onSuccess: (u: UserVO) => void }) {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { user?: UserVO; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? 'Login failed');
      onSuccess(data.user);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Username"
        placeholder="your_username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <Button type="submit" fullWidth isLoading={loading}>Sign In</Button>
    </form>
  );
}

LoginForm.displayName = 'LoginForm';

function RegisterForm({ onSuccess }: { onSuccess: (u: UserVO) => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, pin }),
      });
      const data = await res.json() as { user?: UserVO; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? 'Registration failed');
      onSuccess(data.user);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Full Name"
        placeholder="John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={80}
      />
      <Input
        label="Username"
        placeholder="john_doe"
        value={username}
        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
        required
        minLength={3}
        maxLength={30}
        autoComplete="username"
        hint="Letters, numbers, underscores only"
      />
      <Input
        label="Password"
        type="password"
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        autoComplete="new-password"
      />
      <Input
        label="PIN (6 digits)"
        type="password"
        inputMode="numeric"
        placeholder="••••••"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        minLength={6}
        maxLength={6}
        pattern="\d{6}"
        hint="Used to access your bank account in rooms"
      />
      <Button type="submit" fullWidth isLoading={loading}>Create Account</Button>
    </form>
  );
}

RegisterForm.displayName = 'RegisterForm';
