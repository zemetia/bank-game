import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Bank',
};

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
