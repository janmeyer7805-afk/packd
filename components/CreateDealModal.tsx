'use client';

import { useState } from 'react';
import { supabase, Category } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Upload, Euro, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  onSuccess: () => void;
}

const CATEGORIES: Category[] = ['Supplements', 'Streetwear', 'Beauty', 'Sport'];

const categoryEmojis: Record<Category, string> = {
  Supplements: '',
  Streetwear: '',
  Beauty: '',
  Sport: '',
};

export default function CreateDealModal({ open, onOpenChange, userId, onSuccess }: CreateDealModalProps) {
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

  function reset() {
    setForm({
      title: '',
      photo_url: '',
      original_price: '',
      deal_price: '',
      min_people: 5,
      category: 'Sport',
    });
  }

  const discount = (() => {
    const orig = parseFloat(form.original_price);
    const deal = parseFloat(form.deal_price);
    if (!orig || !deal || orig === 0) return 0;
    return Math.round(((orig - deal) / orig) * 100);
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast.error('Bitte zuerst anmelden');
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
        created_by: userId,
      })
      .select()
      .maybeSingle();

    if (error) {
      toast.error('Fehler beim Erstellen des Deals');
      setSubmitting(false);
      return;
    }

    // Auto-join the creator (trigger increments current_count)
    if (data) {
      await supabase.from('deal_joins').insert({ deal_id: data.id, user_id: userId });
      toast.success('Deal erstellt!');
      reset();
      onOpenChange(false);
      onSuccess();
    }

    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Deal erstellen</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/40">Starte einen Gruppenrabatt — läuft in 48h ab</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Product name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50">Produktname *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="z.B. Whey Protein 2kg – Vanilla"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
            />
          </div>

          {/* Photo URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50">Produktbild (URL)</label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="url"
                value={form.photo_url}
                onChange={e => update('photo_url', e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
              />
            </div>
            {form.photo_url && (
              <div className="rounded-lg overflow-hidden aspect-video mt-2">
                <img
                  src={form.photo_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => update('photo_url', '')}
                />
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Normalpreis *</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.original_price}
                  onChange={e => update('original_price', e.target.value)}
                  placeholder="49,99"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Deal-Preis *</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.deal_price}
                  onChange={e => update('deal_price', e.target.value)}
                  placeholder="34,99"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Discount preview */}
          {discount > 0 && (
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-lg p-3 flex items-center gap-2">
              <span className="text-[#0066FF] text-sm font-bold">{discount}% Rabatt</span>
              <span className="text-[#0066FF]/60 text-xs">— ein starkes Angebot!</span>
            </div>
          )}

          {/* Min people slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/50">Mindestanzahl Personen</label>
              <span className="text-[#0066FF] font-bold text-sm bg-[#0066FF]/10 px-2 py-0.5 rounded">{form.min_people}</span>
            </div>
            <div className="px-1">
              <Slider
                value={[form.min_people]}
                onValueChange={v => update('min_people', v[0])}
                min={2}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <Users className="w-3 h-3" />
              <span>Mindestens {form.min_people} Personen müssen innerhalb von 48h beitreten</span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50">Kategorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  className={cn(
                    'py-2.5 px-3 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-1.5',
                    form.category === cat
                      ? 'bg-[#0066FF] text-white border-[#0066FF]'
                      : 'bg-[#0a0a0a] text-white/50 border-white/10 hover:border-white/20 hover:text-white/70'
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
            className="w-full bg-[#0066FF] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#0055DD] transition-colors disabled:opacity-60 mt-2"
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
      </DialogContent>
    </Dialog>
  );
}
