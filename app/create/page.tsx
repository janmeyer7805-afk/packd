'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase, Category } from '@/lib/supabase';
import { ArrowLeft, Upload, Euro, Users, Tag, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const CATEGORIES: Category[] = ['Supplements', 'Streetwear', 'Beauty', 'Sport'];

const categoryEmojis: Record<Category, string> = {
  Supplements: '💊',
  Streetwear: '👟',
  Beauty: '✨',
  Sport: '🏋️',
};

export default function CreateDealPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    photo_url: '',
    original_price: '',
    deal_price: '',
    min_people: 5,
    category: 'Sport' as Category,
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const discount = (() => {
    const orig = parseFloat(form.original_price);
    const deal = parseFloat(form.deal_price);
    if (!orig || !deal || orig === 0) return 0;
    return Math.round(((orig - deal) / orig) * 100);
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }

    const orig = parseFloat(form.original_price);
    const dealP = parseFloat(form.deal_price);

    if (!form.title.trim()) return toast.error('Bitte gib einen Produktnamen ein');
    if (!orig || orig <= 0) return toast.error('Bitte gib einen gültigen Originalpreis ein');
    if (!dealP || dealP <= 0) return toast.error('Bitte gib einen gültigen Deal-Preis ein');
    if (dealP >= orig) return toast.error('Der Deal-Preis muss unter dem Originalpreis liegen');

    setSubmitting(true);

    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('deals')
      .insert({
        title: form.title.trim(),
        photo_url: form.photo_url.trim(),
        original_price: orig,
        deal_price: dealP,
        min_people: form.min_people,
        current_count: 0,
        category: form.category,
        status: 'open',
        expires_at: expires,
        created_by: user.id,
      })
      .select()
      .maybeSingle();

    if (error) {
      toast.error('Fehler beim Erstellen des Deals');
      setSubmitting(false);
      return;
    }

    // Auto-join the creator
    if (data) {
      await supabase.from('deal_joins').insert({ deal_id: data.id, user_id: user.id });
      await supabase.from('deals').update({ current_count: 1 }).eq('id', data.id);
      toast.success('Deal erstellt!');
      router.push(`/deals/${data.id}`);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#111] flex items-center justify-center border border-white/5 mb-2">
          <Tag className="w-7 h-7 text-white/20" />
        </div>
        <p className="text-white font-semibold">Anmelden erforderlich</p>
        <p className="text-white/40 text-sm text-center">Du musst eingeloggt sein, um einen Deal zu erstellen</p>
        <Link href="/auth" className="mt-2 bg-[#0066FF] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0055DD] transition-colors">
          Jetzt anmelden
        </Link>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#111] border border-white/8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Deal erstellen</h1>
            <p className="text-xs text-white/40">Starte einen Gruppenrabatt</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 pb-28">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Produktname *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="z.B. Whey Protein 2kg – Vanilla"
              className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
            />
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Produktbild (URL)</label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="url"
                value={form.photo_url}
                onChange={e => update('photo_url', e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#111] border border-white/8 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
              />
            </div>
            {form.photo_url && (
              <div className="rounded-xl overflow-hidden aspect-video">
                <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" onError={() => update('photo_url', '')} />
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Normalpreis *</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.original_price}
                  onChange={e => update('original_price', e.target.value)}
                  placeholder="49,99"
                  className="w-full bg-[#111] border border-white/8 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Deal-Preis *</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.deal_price}
                  onChange={e => update('deal_price', e.target.value)}
                  placeholder="34,99"
                  className="w-full bg-[#111] border border-white/8 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Discount preview */}
          {discount > 0 && (
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl p-3 flex items-center gap-2">
              <span className="text-[#0066FF] text-sm font-bold">{discount}% Rabatt</span>
              <span className="text-[#0066FF]/60 text-xs">— ein starkes Angebot!</span>
            </div>
          )}

          {/* Min people */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Mindestanzahl Personen</label>
              <span className="text-[#0066FF] font-bold text-sm">{form.min_people}</span>
            </div>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update('min_people', n)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border',
                    form.min_people === n
                      ? 'bg-[#0066FF] text-white border-[#0066FF]'
                      : 'bg-[#111] text-white/40 border-white/8 hover:border-white/20'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <Users className="w-3 h-3" />
              <span>Mindestens {form.min_people} Personen müssen innerhalb von 48h beitreten</span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Kategorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  className={cn(
                    'py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-2',
                    form.category === cat
                      ? 'bg-[#0066FF] text-white border-[#0066FF]'
                      : 'bg-[#111] text-white/50 border-white/8 hover:border-white/20 hover:text-white/70'
                  )}
                >
                  <span>{categoryEmojis[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0066FF] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#0055DD] transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20 mt-2"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Wird erstellt...
              </span>
            ) : (
              'Deal starten'
            )}
          </button>
        </form>
      </main>

      <Navbar />
    </div>
  );
}
