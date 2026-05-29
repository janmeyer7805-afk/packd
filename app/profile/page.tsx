'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Deal } from '@/lib/supabase';
import DealCard from '@/components/DealCard';
import Navbar from '@/components/Navbar';
import { LogOut, Package, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [myDeals, setMyDeals] = useState<Deal[]>([]);
  const [joinedDeals, setJoinedDeals] = useState<Deal[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }
    if (user) {
      fetchMyData();
    }
  }, [user, authLoading]);

  async function fetchMyData() {
    setLoading(true);
    const [createdRes, joinedRes] = await Promise.all([
      supabase
        .from('deals')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('deal_joins')
        .select('deal_id, deals(*)')
        .eq('user_id', user!.id)
        .order('joined_at', { ascending: false }),
    ]);

    if (createdRes.data) setMyDeals(createdRes.data as Deal[]);
    if (joinedRes.data) {
      const deals = joinedRes.data
        .map((j: any) => j.deals)
        .filter((d: Deal | null) => d !== null && d.created_by !== user!.id) as Deal[];
      setJoinedDeals(deals);
    }
    setLoading(false);
  }

  async function handleSignOut() {
    await signOut();
    toast.success('Abgemeldet');
    router.push('/');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { label: 'Erstellt', value: myDeals.length },
    { label: 'Beigetreten', value: joinedDeals.length },
    { label: 'Erfolgreich', value: [...myDeals, ...joinedDeals].filter(d => d.status === 'success').length },
  ];

  const displayDeals = activeTab === 'created' ? myDeals : joinedDeals;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Profil</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-white/25 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 pb-28 space-y-6">
        {/* Profile card */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          {/* Decorative gradient blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 gradient-primary-subtle rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary-subtle border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-gradient">
                  {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-lg truncate">{profile?.name || 'Anonym'}</p>
              <p className="text-xs text-white/25 truncate">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/[0.06]">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-extrabold text-gradient">{stat.value}</p>
                <p className="text-[10px] text-white/25 leading-tight mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          <button
            onClick={() => setActiveTab('created')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5',
              activeTab === 'created'
                ? 'gradient-primary text-white glow'
                : 'text-white/25 hover:text-white/45'
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Meine ({myDeals.length})
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5',
              activeTab === 'joined'
                ? 'gradient-primary text-white glow'
                : 'text-white/25 hover:text-white/45'
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            Joined ({joinedDeals.length})
          </button>
        </div>

        {/* Deals grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl glass overflow-hidden animate-shimmer">
                <div className="aspect-[4/3] bg-white/[0.02]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-white/[0.04] rounded-lg w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4">
              {activeTab === 'created' ? (
                <Package className="w-6 h-6 text-white/10" />
              ) : (
                <Heart className="w-6 h-6 text-white/10" />
              )}
            </div>
            <p className="text-white/25 font-medium text-sm">
              {activeTab === 'created' ? 'Noch keine Deals erstellt' : 'Noch keinem Deal beigetreten'}
            </p>
            <Link
              href={activeTab === 'created' ? '/create' : '/'}
              className="mt-3 text-emerald-400/60 text-xs font-medium hover:text-emerald-400 transition-colors"
            >
              {activeTab === 'created' ? 'Ersten Deal erstellen' : 'Deals entdecken'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayDeals.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}
