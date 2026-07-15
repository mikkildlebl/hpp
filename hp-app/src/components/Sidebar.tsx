'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/lib/auth';

import { ChartIcon, PencilIcon, UserIcon } from './icons';

const NAV_ITEMS = [
  { href: '/ova', label: 'Öva', icon: PencilIcon },
  { href: '/statistik', label: 'Statistik', icon: ChartIcon },
  { href: '/konto', label: 'Konto', icon: UserIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <nav className="relative z-10 flex w-56 shrink-0 flex-col gap-1 px-4 py-6">
      <Link href="/" className="px-2 pb-6 text-base font-semibold tracking-tight text-text">
        HP Pro
      </Link>

      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-[#3b82f6]/15 text-text' : 'text-text/60 hover:bg-text/[0.04] hover:text-text'
            }`}>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </Link>
        );
      })}

      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2 border-t border-text/10 px-2 pt-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3b82f6]/15 text-[11px] font-semibold text-[#93c5fd]">
            {initials}
          </div>
          <span className="truncate text-xs text-text/50">{user.email}</span>
        </div>
      )}
    </nav>
  );
}
