'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  function update(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
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
        router.push('/');
      } else {
        toast.success('Konto erstellt! Willkommen bei Packd.');
        router.push('/');
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
        router.push('/');
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Back button */}
      <div className="px-5 pt-5">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-blue-strong mb-5">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Pack<span className="text-gradient">d</span>
            </h1>
            <p className="text-white/20 text-sm mt-2">Gemeinsam günstiger einkaufen</p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-white/[0.04] rounded-xl p-1 mb-7 border border-white/[0.06]">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
                mode === 'login'
                  ? 'gradient-primary text-white glow-blue'
                  : 'text-white/25 hover:text-white/45'
              )}
            >
              Anmelden
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
                mode === 'signup'
                  ? 'gradient-primary text-white glow-blue'
                  : 'text-white/25 hover:text-white/45'
              )}
            >
              Registrieren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Dein Name"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#0066FF]/40 focus:bg-white/[0.06] transition-all duration-300"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">E-Mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="deine@email.de"
                required
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#0066FF]/40 focus:bg-white/[0.06] transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 pr-11 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#0066FF]/40 focus:bg-white/[0.06] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/35 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white py-3.5 rounded-xl font-bold text-sm glow-blue hover:opacity-90 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Bitte warten...
                </span>
              ) : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>

          <p className="text-center text-xs text-white/15 mt-7">
            {mode === 'login' ? (
              <>Noch kein Konto? <button onClick={() => setMode('signup')} className="text-[#0066FF]/70 hover:text-[#0066FF] transition-colors">Registrieren</button></>
            ) : (
              <>Bereits registriert? <button onClick={() => setMode('login')} className="text-[#0066FF]/70 hover:text-[#0066FF] transition-colors">Anmelden</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
