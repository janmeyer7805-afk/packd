'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, User, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const links = [
    { href: '/', icon: Home, label: 'Feed' },
    { href: '/create', icon: Plus, label: 'Deal' },
    user
      ? { href: '/profile', icon: User, label: 'Profil' }
      : { href: '/auth', icon: LogIn, label: 'Login' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5">
      <div className="max-w-lg mx-auto flex items-center justify-around px-4 py-2 pb-safe">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                active
                  ? 'text-[#0066FF]'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {href === '/profile' && user && profile?.name ? (
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border',
                  active ? 'border-[#0066FF]/50 bg-[#0066FF]/20' : 'border-white/10 bg-white/5'
                )}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className={cn('text-xs font-bold', active ? 'text-[#0066FF]' : 'text-white/50')}>
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ) : href === '/create' ? (
                <div className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200',
                  active
                    ? 'bg-[#0066FF] shadow-lg shadow-blue-500/30'
                    : 'bg-[#0066FF]/80 hover:bg-[#0066FF]'
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              {href !== '/create' && (
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
