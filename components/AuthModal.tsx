'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  function update(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function reset() {
    setForm({ email: '', password: '', name: '' });
    setMode('login');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === 'signup') {
      if (!form.name.trim()) {
        toast.error('Bitte gib deinen Namen ein');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name.trim() } },
      });
      if (error) {
        toast.error(error.message === 'User already registered' ? 'E-Mail bereits registriert' : error.message);
      } else if (data.user && !data.session) {
        toast.success('Registrierung erfolgreich! Bitte bestätige deine E-Mail.');
        reset();
        onOpenChange(false);
      } else {
        toast.success('Konto erstellt! Willkommen bei Packd.');
        reset();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) {
        toast.error('Ungültige Anmeldedaten');
      } else {
        toast.success('Willkommen zurück!');
        reset();
        onOpenChange(false);
      }
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="bg-[#0a0a0a] border-white/[0.08] text-white sm:max-w-sm backdrop-blur-2xl">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl gradient-primary glow flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">
            Pack<span className="text-gradient">d</span>
          </DialogTitle>
          <p className="text-xs text-white/25 mt-1">Gemeinsam günstiger einkaufen</p>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex bg-white/[0.04] rounded-lg p-1 mt-4 border border-white/[0.06]">
          <button
            onClick={() => setMode('login')}
            className={cn(
              'flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-300',
              mode === 'login'
                ? 'gradient-primary text-white glow'
                : 'text-white/25 hover:text-white/45'
            )}
          >
            Anmelden
          </button>
          <button
            onClick={() => setMode('signup')}
            className={cn(
              'flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-300',
              mode === 'signup'
                ? 'gradient-primary text-white glow'
                : 'text-white/25 hover:text-white/45'
            )}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Dein Name"
                required
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 transition-all duration-300"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">E-Mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="deine@email.de"
              required
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 transition-all duration-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Passwort</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 pr-10 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/35 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-white py-3 rounded-xl font-bold text-sm glow hover:opacity-90 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Bitte warten...
              </span>
            ) : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <p className="text-center text-xs text-white/15 mt-4">
          {mode === 'login' ? (
            <>Noch kein Konto? <button onClick={() => setMode('signup')} className="text-emerald-400/70 hover:text-emerald-400 transition-colors">Registrieren</button></>
          ) : (
            <>Bereits registriert? <button onClick={() => setMode('login')} className="text-emerald-400/70 hover:text-emerald-400 transition-colors">Anmelden</button></>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
