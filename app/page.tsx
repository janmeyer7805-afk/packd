'use client';

import { useEffect, useState } from 'react';
import { supabase, Deal, Category } from '@/lib/supabase';
import DealCard from '@/components/DealCard';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import CreateDealModal from '@/components/CreateDealModal';
import { Flame, Zap, Search, LogIn, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const CATEGORIES: { label: string; value: Category | 'all' }[] = [
  { label: 'Alle', value: 'all' },
  { label: 'Supplements', value: 'Supplements' },
  { label: 'Streetwear', value: 'Streetwear' },
  { label: 'Beauty', value: 'Beauty' },
  { label: 'Sport', value: 'Sport' },
];

export default function HomePage() {
  const { user, profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'open' | 'success'>('open');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchDeals();

    const channel = supabase
      .channel('deals-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchDeals)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_joins' }, fetchDeals)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchDeals() {
    const { data } = await supabase
      .from('deals')
      .select('*, profiles(id, name, avatar_url)')
      .order('created_at', { ascending: false });
    if (data) setDeals(data as Deal[]);
    setLoading(false);
  }

  const filtered = deals.filter(d => {
    const matchesTab = activeTab === 'open' ? d.status === 'open' : d.status === 'success';
    const matchesCat = activeCategory === 'all' || d.category === activeCategory;
    const matchesSearch = !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Pack<span className="text-[#0066FF]">d</span>
              </h1>
              <p className="text-xs text-white/40 font-medium">Gemeinsam günstiger</p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white hover:bg-[#0055DD] transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <Link href="/profile">
                    <div className="w-10 h-10 rounded-full border-2 border-[#0066FF]/30 bg-[#0066FF]/15 flex items-center justify-center hover:border-[#0066FF]/60 transition-colors">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#0066FF]">
                          {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Deals durchsuchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/50 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 bg-[#111]/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('open')}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                activeTab === 'open'
                  ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              Offen
            </button>
            <button
              onClick={() => setActiveTab('success')}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                activeTab === 'success'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              <Zap className="inline w-3 h-3 mr-1" />
              Deals aktiv
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
                  activeCategory === cat.value
                    ? 'bg-[#0066FF] text-white border-[#0066FF]'
                    : 'bg-transparent text-white/50 border-white/10 hover:border-white/20 hover:text-white/70'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-lg mx-auto px-4 pt-4 pb-28">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#111111] border border-white/5 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-1.5 bg-white/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111] flex items-center justify-center mb-4 border border-white/5">
              <Flame className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 font-medium text-sm">Keine Deals gefunden</p>
            <p className="text-white/25 text-xs mt-1">
              {user ? 'Sei der Erste und erstelle einen Deal!' : 'Melde dich an, um Deals zu erstellen'}
            </p>
            {user && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 bg-[#0066FF] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0055DD] transition-colors"
              >
                Deal erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(deal => (
              <DealCard key={deal.id} deal={deal} userId={user?.id} onJoin={fetchDeals} />
            ))}
          </div>
        )}
      </main>

      <Navbar />

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <CreateDealModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        userId={user?.id}
        onSuccess={fetchDeals}
      />
    </div>
  );
}
