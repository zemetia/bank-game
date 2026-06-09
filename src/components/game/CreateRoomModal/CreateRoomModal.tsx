'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RoomForm } from '../RoomForm';

interface Props {
  label?: string;
  title?: string;
}

CreateRoomModal.displayName = 'CreateRoomModal';

export function CreateRoomModal({ label = 'Create New Room', title = 'Create New Room' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="xl" fullWidth onClick={() => setOpen(true)}>
        {label}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-room-title"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-[--color-border] bg-[--color-surface] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="create-room-title"
                className="text-lg font-semibold text-[--color-foreground]"
              >
                {title}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-[--color-foreground-muted] transition-colors hover:bg-[--color-surface-raised] hover:text-[--color-foreground]"
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <RoomForm />
          </div>
        </div>
      )}
    </>
  );
}
