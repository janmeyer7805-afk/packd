'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase, Category } from '@/lib/supabase';
import { ArrowLeft, Upload, Euro, Users, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const CATEGORIES: Category[] = ['Supplements', 'Streetwear', 'Beauty', 'Sport'];

const categoryIcons: Record<Category, string> = {
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

    if (data) {
      await supabase.from('deal_joins').insert({ deal_id: data.id, user_id: user.id });
      toast.success('Deal erstellt!');
      router.push(`/deals/${data.id}`);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-5">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-2">
          <Tag className="w-7 h-7 text-white/10" />
        </div>
        <p className="text-white font-semibold">Anmelden erforderlich</p>
        <p className="text-white/25 text-sm text-center">Du musst eingeloggt sein, um einen Deal zu erstellen</p>
        <Link href="/auth" className="mt-2 gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm glow hover:opacity-90 transition-all">
          Jetzt anmelden
        </Link>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Deal erstellen</h1>
            <p className="text-[11px] text-white/25">Starte einen Gruppenrabatt</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-5 pb-28">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product name */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Produktname *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="z.B. Whey Protein 2kg – Vanilla"
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all duration-300"
            />
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Produktbild (URL)</label>
            <div className="relative">
              <Upload className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
              <input
                type="url"
                value={form.photo_url}
                onChange={e => update('photo_url', e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all duration-300"
              />
            </div>
            {form.photo_url && (
              <div className="rounded-xl overflow-hidden aspect-video border border-white/[0.06]">
                <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" onError={() => update('photo_url', '')} />
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Normalpreis *</label>
              <div className="relative">
                <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.original_price}
                  onChange={e => update('original_price', e.target.value)}
                  placeholder="49,99"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all duration-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Deal-Preis *</label>
              <div className="relative">
                <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.deal_price}
                  onChange={e => update('deal_price', e.target.value)}
                  placeholder="34,99"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Discount preview */}
          {discount > 0 && (
            <div className="gradient-accent-subtle border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-2">
              <span className="text-amber-400 text-sm font-bold">{discount}% Rabatt</span>
              <span className="text-amber-400/40 text-xs">— ein starkes Angebot!</span>
            </div>
          )}

          {/* Min people */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Mindestanzahl Personen</label>
              <span className="text-gradient font-bold text-sm">{form.min_people}</span>
            </div>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update('min_people', n)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border',
                    form.min_people === n
                      ? 'gradient-primary-subtle text-emerald-300 border-emerald-500/30'
                      : 'bg-white/[0.03] text-white/25 border-white/[0.06] hover:border-white/15 hover:text-white/40'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/20">
              <Users className="w-3 h-3" />
              <span>Mindestens {form.min_people} Personen müssen innerhalb von 48h beitreten</span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Kategorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  className={cn(
                    'py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 border flex items-center gap-2',
                    form.category === cat
                      ? 'gradient-primary-subtle text-emerald-300 border-emerald-500/30'
                      : 'bg-white/[0.03] text-white/25 border-white/[0.06] hover:border-white/15 hover:text-white/40'
                  )}
                >
                  <span>{categoryIcons[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-primary text-white py-4 rounded-2xl font-bold text-base glow-strong hover:opacity-90 transition-all disabled:opacity-50 mt-2"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
