'use client';

import Link from 'next/link';
import { Timer, Users, Tag, UserPlus } from 'lucide-react';
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
  Supplements: 'bg-emerald-500/15 text-emerald-400',
  Streetwear: 'bg-orange-500/15 text-orange-400',
  Beauty: 'bg-pink-500/15 text-pink-400',
  Sport: 'bg-blue-500/15 text-blue-400',
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
        'rounded-2xl overflow-hidden bg-[#111111] border transition-all duration-300 group-hover:border-white/15 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-black/40',
        isSuccess ? 'border-[#0066FF]/40' : isFailed ? 'border-white/5 opacity-60' : 'border-white/8'
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {deal.photo_url ? (
            <img
              src={deal.photo_url}
              alt={deal.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
              <Tag className="w-10 h-10 text-white/10" />
            </div>
          )}

          {/* Discount badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-[#0066FF] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              -{discount}%
            </span>
          </div>

          {/* Status badge */}
          {isSuccess && (
            <div className="absolute top-3 right-3">
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                Deal aktiv!
              </span>
            </div>
          )}

          {/* Category */}
          <div className="absolute bottom-3 right-3">
            <span className={cn('text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm', categoryColors[deal.category] || 'bg-white/10 text-white/60')}>
              {deal.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-white">
            {deal.title}
          </h3>

          {/* Prices */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#0066FF]">
              {deal.deal_price.toFixed(2).replace('.', ',')} €
            </span>
            <span className="text-sm text-white/35 line-through">
              {deal.original_price.toFixed(2).replace('.', ',')} €
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {currentCount}/{deal.min_people} Personen
              </span>
              <span className={cn(
                'flex items-center gap-1',
                isFailed ? 'text-red-400' : 'text-white/50'
              )}>
                <Timer className="w-3 h-3" />
                {isFailed ? 'Abgelaufen' : timeLeft}
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isSuccess ? 'bg-emerald-500' : 'bg-[#0066FF]'
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
                'w-full py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5',
                hasJoined
                  ? 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/15'
                  : 'bg-[#0066FF] text-white hover:bg-[#0055DD]',
                joining && 'opacity-60'
              )}
            >
              {joining ? (
                <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  {hasJoined ? 'Beigetreten' : 'Deal beitreten'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
