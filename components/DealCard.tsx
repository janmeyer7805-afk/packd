'use client';

import Link from 'next/link';
import { Timer, Users, Tag, UserPlus, TrendingUp } from 'lucide-react';
import { Deal } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatTimeLeft, getDiscountPercent } from '@/lib/dealUtils';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DealCardProps {
  deal: Deal;
  userId?: string;
  onJoin?: () => void;
}

const categoryColors: Record<string, string> = {
  Supplements: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Streetwear: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Beauty: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  Sport: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

export default function DealCard({ deal, userId, onJoin }: DealCardProps) {
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [currentCount, setCurrentCount] = useState(deal.current_count);

  const progress = Math.min((currentCount / deal.min_people) * 100, 100);
  const discount = getDiscountPercent(deal.original_price, deal.deal_price);
  const timeLeft = formatTimeLeft(deal.expires_at);
  const isSuccess = deal.status === 'success';
  const isFailed = deal.status === 'failed';

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error('Bitte zuerst anmelden');
      return;
    }

    setJoining(true);

    if (hasJoined) {
      const { error } = await supabase
        .from('deal_joins')
        .delete()
        .eq('deal_id', deal.id)
        .eq('user_id', userId);
      if (!error) {
        setHasJoined(false);
        setCurrentCount(c => Math.max(0, c - 1));
        toast.success('Deal verlassen');
        onJoin?.();
      }
    } else {
      const { error } = await supabase
        .from('deal_joins')
        .insert({ deal_id: deal.id, user_id: userId });
      if (!error) {
        setHasJoined(true);
        setCurrentCount(c => c + 1);
        toast.success('Du bist dabei!');
        onJoin?.();
      } else {
        toast.error('Fehler beim Beitreten');
      }
    }

    setJoining(false);
  }

  return (
    <Link href={`/deals/${deal.id}`} className="block group">
      <div className={cn(
        'rounded-2xl overflow-hidden glass transition-all duration-500',
        'group-hover:shadow-2xl group-hover:shadow-[#0066FF]/5',
        'group-hover:-translate-y-1 group-hover:border-white/10',
        isSuccess && 'border-[#0066FF]/20',
        isFailed && 'opacity-40',
        !isSuccess && !isFailed && 'border-white/[0.06]'
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {deal.photo_url ? (
            <img
              src={deal.photo_url}
              alt={deal.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/[0.04] to-transparent flex items-center justify-center">
              <Tag className="w-10 h-10 text-white/[0.06]" />
            </div>
          )}

          {/* Gradient overlay on image bottom */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent pointer-events-none" />

          {/* Discount badge */}
          <div className="absolute top-3 left-3">
            <span className="gradient-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-[#0066FF]/30">
              -{discount}%
            </span>
          </div>

          {/* Status badge */}
          {isSuccess && (
            <div className="absolute top-3 right-3">
              <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Aktiv
              </span>
            </div>
          )}

          {/* Category pill */}
          <div className="absolute bottom-3 right-3">
            <span className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md border',
              categoryColors[deal.category] || 'bg-white/10 text-white/60 border-white/10'
            )}>
              {deal.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2.5">
          <h3 className="font-semibold text-white text-[13px] leading-snug line-clamp-2">
            {deal.title}
          </h3>

          {/* Prices */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gradient">
              {deal.deal_price.toFixed(2).replace('.', ',')} €
            </span>
            <span className="text-xs text-white/25 line-through">
              {deal.original_price.toFixed(2).replace('.', ',')} €
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {currentCount}/{deal.min_people}
              </span>
              <span className={cn(
                'flex items-center gap-1',
                isFailed ? 'text-red-400/60' : 'text-white/40'
              )}>
                <Timer className="w-3 h-3" />
                {isFailed ? 'Abgelaufen' : timeLeft}
              </span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  isSuccess ? 'bg-emerald-500' : 'gradient-primary'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Join button */}
          {!isFailed && userId && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className={cn(
                'w-full py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5',
                hasJoined
                  ? 'glass text-white/60 hover:text-white/80'
                  : 'gradient-primary text-white glow-blue hover:opacity-90',
                joining && 'opacity-50'
              )}
            >
              {joining ? (
                <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  {hasJoined ? 'Beigetreten' : 'Beitreten'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
