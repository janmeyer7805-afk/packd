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
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-lg mx-auto">
        <div className="glass-strong rounded-2xl px-2 py-2 flex items-center justify-around">
          {links.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-300',
                  active ? 'text-white' : 'text-white/30 hover:text-white/50'
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 gradient-primary rounded-full" />
                )}

                {href === '/profile' && user && profile?.name ? (
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300',
                    active ? 'gradient-primary-subtle border border-[#0066FF]/30' : 'bg-white/[0.04]'
                  )}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <span className={cn('text-[10px] font-bold', active ? 'text-gradient' : 'text-white/40')}>
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ) : href === '/create' ? (
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 -my-1',
                    active
                      ? 'gradient-primary glow-blue'
                      : 'gradient-primary opacity-70 hover:opacity-100'
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <Icon className={cn('w-5 h-5 transition-all duration-300', active && 'text-gradient')} />
                )}
                <span className={cn('text-[9px] font-medium', href === '/create' && 'sr-only')}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
