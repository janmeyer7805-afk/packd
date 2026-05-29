'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Deal } from '@/lib/supabase';
import DealCard from '@/components/DealCard';
import Navbar from '@/components/Navbar';
import { LogOut, User, Package, Heart, ChevronRight, Settings } from 'lucide-react';
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
        <div className="w-8 h-8 rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { label: 'Deals erstellt', value: myDeals.length },
    { label: 'Deals beigetreten', value: joinedDeals.length },
    { label: 'Erfolgreiche', value: [...myDeals, ...joinedDeals].filter(d => d.status === 'success').length },
  ];

  const displayDeals = activeTab === 'created' ? myDeals : joinedDeals;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Profil</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 pb-28 space-y-6">
        {/* Profile card */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0066FF]/20 border-2 border-[#0066FF]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-[#0066FF]">
                {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-lg truncate">{profile?.name || 'Anonym'}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/35 leading-tight mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#111]/50 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setActiveTab('created')}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5',
              activeTab === 'created'
                ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Meine Deals ({myDeals.length})
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5',
              activeTab === 'joined'
                ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            Beigetreten ({joinedDeals.length})
          </button>
        </div>

        {/* Deals grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#111] border border-white/5 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#111] flex items-center justify-center mb-3 border border-white/5">
              {activeTab === 'created' ? (
                <Package className="w-6 h-6 text-white/20" />
              ) : (
                <Heart className="w-6 h-6 text-white/20" />
              )}
            </div>
            <p className="text-white/40 font-medium text-sm">
              {activeTab === 'created' ? 'Noch keine Deals erstellt' : 'Noch keinem Deal beigetreten'}
            </p>
            <Link
              href={activeTab === 'created' ? '/create' : '/'}
              className="mt-3 text-[#0066FF] text-xs font-medium hover:underline"
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
