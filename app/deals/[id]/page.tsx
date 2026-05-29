'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Deal, DealJoin } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Share2, Users, Timer, Tag, CheckCircle2, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeLeft, getDiscountPercent } from '@/lib/dealUtils';
import { toast } from 'sonner';
import Link from 'next/link';

const categoryColors: Record<string, string> = {
  Supplements: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Streetwear: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Beauty: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  Sport: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [joins, setJoins] = useState<DealJoin[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDeal(params.id as string);
      fetchJoins(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (user && joins.length > 0) {
      setHasJoined(joins.some(j => j.user_id === user.id));
    }
  }, [user, joins]);

  async function fetchDeal(id: string) {
    const { data } = await supabase
      .from('deals')
      .select('*, profiles(id, name, avatar_url)')
      .eq('id', id)
      .maybeSingle();
    if (data) setDeal(data as Deal);
    setLoading(false);
  }

  async function fetchJoins(id: string) {
    const { data } = await supabase
      .from('deal_joins')
      .select('*, profiles(id, name, avatar_url)')
      .eq('deal_id', id)
      .order('joined_at', { ascending: true });
    if (data) setJoins(data as DealJoin[]);
  }

  async function handleJoin() {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!deal) return;
    setJoining(true);

    if (hasJoined) {
      const { error } = await supabase
        .from('deal_joins')
        .delete()
        .eq('deal_id', deal.id)
        .eq('user_id', user.id);
      if (!error) {
        setHasJoined(false);
        fetchJoins(deal.id);
        fetchDeal(deal.id);
        toast.success('Deal verlassen');
      }
    } else {
      const { error } = await supabase
        .from('deal_joins')
        .insert({ deal_id: deal.id, user_id: user.id });
      if (!error) {
        setHasJoined(true);
        fetchJoins(deal.id);
        fetchDeal(deal.id);
        toast.success('Du bist dabei!');
      } else {
        toast.error('Fehler beim Beitreten');
      }
    }
    setJoining(false);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: deal?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link kopiert!');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-white/50">Deal nicht gefunden</p>
        <Link href="/" className="text-[#0066FF] text-sm font-medium">Zurück zum Feed</Link>
      </div>
    );
  }

  const progress = Math.min((deal.current_count / deal.min_people) * 100, 100);
  const discount = getDiscountPercent(deal.original_price, deal.deal_price);
  const timeLeft = formatTimeLeft(deal.expires_at);
  const isSuccess = deal.status === 'success';
  const isFailed = deal.status === 'failed';
  const savings = (deal.original_price - deal.deal_price).toFixed(2).replace('.', ',');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-lg mx-auto">
        {/* Hero image */}
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            {deal.photo_url ? (
              <img src={deal.photo_url} alt={deal.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
                <Tag className="w-16 h-16 text-white/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>

          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Discount badge */}
          <div className="absolute bottom-4 left-4">
            <span className="bg-[#0066FF] text-white text-sm font-black px-3 py-1.5 rounded-xl">
              -{discount}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-32 space-y-5 -mt-2">
          {/* Title & category */}
          <div className="space-y-2">
            <span className={cn('inline-flex text-xs font-medium px-2.5 py-1 rounded-lg border', categoryColors[deal.category] || 'bg-white/10 text-white/60 border-white/10')}>
              {deal.category}
            </span>
            <h1 className="text-2xl font-black text-white leading-tight">{deal.title}</h1>
          </div>

          {/* Price block */}
          <div className="bg-[#111] rounded-2xl p-4 border border-white/8 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                {deal.deal_price.toFixed(2).replace('.', ',')} €
              </span>
              <span className="text-lg text-white/35 line-through">
                {deal.original_price.toFixed(2).replace('.', ',')} €
              </span>
            </div>
            <p className="text-sm text-emerald-400 font-medium">Du sparst {savings} €</p>
          </div>

          {/* Status banner */}
          {isSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-400 font-semibold text-sm">Deal erfolgreich!</p>
                <p className="text-emerald-400/70 text-xs">Alle Teilnehmer erhalten ihren Rabatt.</p>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Deal abgelaufen</p>
                <p className="text-red-400/70 text-xs">Nicht genug Personen haben sich angemeldet.</p>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="bg-[#111] rounded-2xl p-4 border border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Gruppenfortschritt</span>
              {!isFailed && (
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <Timer className="w-3.5 h-3.5" />
                  {timeLeft}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {deal.current_count} von {deal.min_people} Personen
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    isSuccess ? 'bg-emerald-500' : 'bg-[#0066FF]'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-white/30">
                Noch {Math.max(deal.min_people - deal.current_count, 0)} Person(en) fehlen
              </p>
            </div>
          </div>

          {/* Participants */}
          {joins.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                Teilnehmer ({joins.length})
              </h3>
              <div className="space-y-2">
                {joins.map(join => (
                  <div key={join.id} className="flex items-center gap-3 bg-[#111] rounded-xl p-3 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#0066FF]">
                        {join.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="text-sm text-white/70 font-medium">{join.profiles?.name || 'Anonym'}</span>
                    {join.user_id === deal.created_by && (
                      <span className="ml-auto text-xs text-[#0066FF] font-medium bg-[#0066FF]/10 px-2 py-0.5 rounded-lg">
                        Ersteller
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky join button */}
      {!isFailed && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleJoin}
              disabled={joining}
              className={cn(
                'w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 disabled:opacity-60',
                hasJoined
                  ? 'bg-white/8 text-white/60 border border-white/10 hover:bg-white/12'
                  : isSuccess
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25'
                    : 'bg-[#0066FF] text-white hover:bg-[#0055DD] shadow-lg shadow-blue-500/25'
              )}
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Bitte warten...
                </span>
              ) : hasJoined ? (
                'Deal verlassen'
              ) : isSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Deal sichern
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Jetzt beitreten
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}
