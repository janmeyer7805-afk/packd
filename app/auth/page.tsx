'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, ArrowLeft, Zap } from 'lucide-react';
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
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name.trim() } },
      });
      if (error) {
        toast.error(error.message === 'User already registered' ? 'E-Mail bereits registriert' : error.message);
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
      <div className="px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 mb-4">
              <Zap className="w-7 h-7 text-[#0066FF]" />
            </div>
            <h1 className="text-3xl font-black text-white">
              Pack<span className="text-[#0066FF]">d</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">Gemeinsam günstiger einkaufen</p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-[#111] rounded-xl p-1 mb-6 border border-white/5">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                mode === 'login'
                  ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              Anmelden
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                mode === 'signup'
                  ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              Registrieren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Dein Name"
                  required
                  className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">E-Mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="deine@email.de"
                required
                className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#111] border border-white/8 rounded-xl px-4 pr-11 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0066FF]/60 transition-colors"
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
              className="w-full bg-[#0066FF] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#0055DD] transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Bitte warten...
                </span>
              ) : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>

          <p className="text-center text-xs text-white/25 mt-6">
            {mode === 'login' ? (
              <>Noch kein Konto? <button onClick={() => setMode('signup')} className="text-[#0066FF] hover:underline">Registrieren</button></>
            ) : (
              <>Bereits registriert? <button onClick={() => setMode('login')} className="text-[#0066FF] hover:underline">Anmelden</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
