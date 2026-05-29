'use client';

import { useEffect, useState } from 'react';
import { supabase, Deal, Category } from '@/lib/supabase';
import DealCard from '@/components/DealCard';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import CreateDealModal from '@/components/CreateDealModal';
import { Flame, Zap, Search, Plus, Sparkles } from 'lucide-react';
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
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-lg mx-auto px-5 pt-5 pb-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-blue">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  Pack<span className="text-gradient">d</span>
                </h1>
                <p className="text-[10px] text-white/30 font-medium tracking-wide uppercase">Gemeinsam günstiger</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {user ? (
                <>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="h-9 px-4 rounded-xl gradient-primary text-white text-xs font-semibold flex items-center gap-1.5 glow-blue hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Neu
                  </button>
                  <Link href="/profile">
                    <div className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:border-[#0066FF]/30 transition-colors">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-gradient">
                          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="h-9 px-4 rounded-xl glass text-white text-xs font-semibold flex items-center gap-1.5 hover:border-white/15 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Deals durchsuchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#0066FF]/40 focus:bg-white/[0.06] transition-all duration-300"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 bg-white/[0.04] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('open')}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300',
                activeTab === 'open'
                  ? 'gradient-primary text-white glow-blue'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              Offen
            </button>
            <button
              onClick={() => setActiveTab('success')}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300',
                activeTab === 'success'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              <Zap className="inline w-3 h-3 mr-1" />
              Aktiv
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  'flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
                  activeCategory === cat.value
                    ? 'gradient-primary-subtle text-white border border-[#0066FF]/30'
                    : 'text-white/30 hover:text-white/50 border border-transparent'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-lg mx-auto px-5 pt-4 pb-28">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl glass overflow-hidden">
                <div className="aspect-[4/3] bg-white/[0.02] animate-shimmer" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-white/[0.04] rounded-lg w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
                  <div className="h-1.5 bg-white/[0.04] rounded-full w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-5">
              <Flame className="w-7 h-7 text-white/15" />
            </div>
            <p className="text-white/30 font-semibold text-sm">Keine Deals gefunden</p>
            <p className="text-white/15 text-xs mt-1.5 max-w-[200px]">
              {user ? 'Sei der Erste und erstelle einen Deal!' : 'Melde dich an, um Deals zu erstellen'}
            </p>
            {user && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-5 h-10 px-6 rounded-xl gradient-primary text-white text-sm font-semibold glow-blue hover:opacity-90 transition-opacity"
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
