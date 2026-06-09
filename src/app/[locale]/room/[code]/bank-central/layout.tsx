import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bank Central',
};

export default function BankCentralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
