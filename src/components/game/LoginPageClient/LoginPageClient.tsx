'use client';

import { useState } from 'react';
import { useUserStore } from '@/stores';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserVO } from '@/types/value-objects';

type Tab = 'login' | 'register';

interface Props {
  destination: string;
}

LoginPageClient.displayName = 'LoginPageClient';

export function LoginPageClient({ destination }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const { setUser } = useUserStore();

  function handleSuccess(user: UserVO) {
    setUser({ userId: user.id, username: user.username, name: user.name });
    window.location.replace(destination);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm shadow-xl">
      <div className="mb-5 flex gap-1">
        <TabButton active={tab === 'login'} onClick={() => setTab('login')}>Sign In</TabButton>
        <TabButton active={tab === 'register'} onClick={() => setTab('register')}>Register</TabButton>
      </div>
      {tab === 'login'
        ? <LoginForm onSuccess={handleSuccess} />
        : <RegisterForm onSuccess={handleSuccess} />
      }
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
