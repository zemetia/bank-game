'use client';

import { useState } from 'react';
import { X, UserCircle2, KeyRound, Lock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks';
import { useUserStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserVO } from '@/types/value-objects';

UserSettingsModal.displayName = 'UserSettingsModal';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-12" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Account Settings</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col divide-y divide-border">
          <ChangeNameSection onClose={onClose} />
          <TransferPinSection />
          <ChangePasswordSection />
          <ChangePinSection />
          <DeleteAccountSection onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-6 pt-5 pb-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-foreground-muted">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

SectionHeader.displayName = 'SectionHeader';

// --- Change Name ---
function ChangeNameSection({ onClose }: { onClose: () => void }) {
  const { name, userId, setUser, username } = useUserStore();
  const toast = useToast();
  const [value, setValue] = useState(name ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() === name) { onClose(); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value.trim() }),
      });
      const data = await res.json() as { user?: UserVO; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? 'Failed');
      setUser({ userId: data.user.id, username: data.user.username, name: data.user.name });
      toast.success('Name updated');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!userId) return null;

  return (
    <div className="pb-5">
      <SectionHeader icon={<UserCircle2 className="h-3.5 w-3.5" />} title="Profile" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6">
        <Input
          label="Display Name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          maxLength={80}
          placeholder="Your name"
        />
        <p className="text-xs text-foreground-muted">Username: <span className="font-mono">{username}</span></p>
        <Button type="submit" size="sm" isLoading={loading} disabled={!value.trim() || value.trim() === name}>
          Save Name
        </Button>
      </form>
    </div>
  );
}

ChangeNameSection.displayName = 'ChangeNameSection';

// --- Transfer PIN Toggle ---
function TransferPinSection() {
  const toast = useToast();
  const [pinEnabled, setPinEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function fetchSetting() {
    if (fetched) return;
    setFetched(true);
    try {
      const res = await fetch('/api/users/settings');
      if (res.ok) {
        const data = await res.json() as { transferPinEnabled: boolean };
        setPinEnabled(data.transferPinEnabled);
      }
    } catch { /* ignore */ }
  }

  async function handleToggle() {
    const next = !pinEnabled;
    setLoading(true);
    try {
      const res = await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferPinEnabled: next }),
      });
      if (!res.ok) throw new Error('Failed');
      setPinEnabled(next);
      toast.success(next ? 'PIN required for transfers' : 'PIN disabled for transfers');
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-5" onFocus={fetchSetting} onMouseEnter={fetchSetting}>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Require PIN for transfers</p>
          <p className="text-xs text-foreground-muted">
            When on, each bank transfer requires your PIN to confirm
          </p>
        </div>
        <Button
          size="sm"
          variant={pinEnabled ? 'primary' : 'outline'}
          onClick={handleToggle}
          disabled={loading || pinEnabled === null}
        >
          {pinEnabled === null ? '…' : pinEnabled ? 'On' : 'Off'}
        </Button>
      </div>
    </div>
  );
}

TransferPinSection.displayName = 'TransferPinSection';

// --- Change Password ---
function ChangePasswordSection() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('Password updated');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-5">
      <SectionHeader icon={<Lock className="h-3.5 w-3.5" />} title="Change Password" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6">
        <Input
          label="Current password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••"
        />
        <Input
          label="New password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Repeat new password"
        />
        <Button type="submit" size="sm" isLoading={loading} disabled={!current || !next || !confirm}>
          Update Password
        </Button>
      </form>
    </div>
  );
}

ChangePasswordSection.displayName = 'ChangePasswordSection';

// --- Change PIN ---
function ChangePinSection() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  function pinInput(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setter(e.target.value.replace(/\D/g, '').slice(0, 6));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast.error('PINs do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users/pin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: current, newPin: next }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('PIN updated');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-5">
      <SectionHeader icon={<KeyRound className="h-3.5 w-3.5" />} title="Change PIN" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6">
        <Input
          label="Current PIN"
          type="password"
          inputMode="numeric"
          value={current}
          onChange={pinInput(setCurrent)}
          required
          minLength={6}
          maxLength={6}
          placeholder="••••••"
        />
        <Input
          label="New PIN (6 digits)"
          type="password"
          inputMode="numeric"
          value={next}
          onChange={pinInput(setNext)}
          required
          minLength={6}
          maxLength={6}
          placeholder="••••••"
        />
        <Input
          label="Confirm new PIN"
          type="password"
          inputMode="numeric"
          value={confirm}
          onChange={pinInput(setConfirm)}
          required
          minLength={6}
          maxLength={6}
          placeholder="••••••"
        />
        <Button type="submit" size="sm" isLoading={loading} disabled={!current || next.length < 6 || confirm.length < 6}>
          Update PIN
        </Button>
      </form>
    </div>
  );
}

ChangePinSection.displayName = 'ChangePinSection';

// --- Delete Account ---
function DeleteAccountSection({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { clearUser } = useUserStore();
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      clearUser();
      onClose();
      window.location.replace('/login');
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="pb-6">
      <SectionHeader icon={<Trash2 className="h-3.5 w-3.5 text-destructive" />} title="Danger Zone" />
      <div className="px-6">
        {!confirming ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive-subtle p-4">
            <p className="text-sm text-foreground">Delete Account</p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Permanently deletes your account and removes you from all rooms.
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="mt-3"
              onClick={() => setConfirming(true)}
            >
              Delete My Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handleDelete} className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive-subtle p-4">
            <p className="text-sm font-medium text-destructive">This cannot be undone.</p>
            <Input
              label="Enter your password to confirm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setConfirming(false); setPassword(''); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                isLoading={loading}
                disabled={!password}
                className="flex-1"
              >
                Delete Forever
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

DeleteAccountSection.displayName = 'DeleteAccountSection';

