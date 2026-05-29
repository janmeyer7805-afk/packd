'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, Zap } from 'lucide-react';
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
        // Email confirmation required — tell the user
        toast.success('Registrierung erfolgreich! Bitte bestätige deine E-Mail.');
        reset();
        onOpenChange(false);
      } else {
        // Auto-confirmed — logged in immediately
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
      <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-sm">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#0066FF]" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">
            Pack<span className="text-[#0066FF]">d</span>
          </DialogTitle>
          <p className="text-xs text-white/40 mt-1">Gemeinsam günstiger einkaufen</p>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex bg-[#0a0a0a] rounded-lg p-1 mt-4">
          <button
            onClick={() => setMode('login')}
            className={cn(
              'flex-1 py-2 rounded-md text-sm font-semibold transition-all',
              mode === 'login'
                ? 'bg-[#0066FF] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            Anmelden
          </button>
          <button
            onClick={() => setMode('signup')}
            className={cn(
              'flex-1 py-2 rounded-md text-sm font-semibold transition-all',
              mode === 'signup'
                ? 'bg-[#0066FF] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Dein Name"
                required
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50">E-Mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="deine@email.de"
              required
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50">Passwort</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0066FF] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0055DD] transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Bitte warten...
              </span>
            ) : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-4">
          {mode === 'login' ? (
            <>Noch kein Konto? <button onClick={() => setMode('signup')} className="text-[#0066FF] hover:underline">Registrieren</button></>
          ) : (
            <>Bereits registriert? <button onClick={() => setMode('login')} className="text-[#0066FF] hover:underline">Anmelden</button></>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
