'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Mail, Lock, User, Building2, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'signup';
type RoleChoice = 'creator' | 'brand';

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<RoleChoice>('creator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              role,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            role,
            display_name: displayName.trim(),
          });

          if (profileError) {
            console.error('Profile creation failed:', profileError);
          }

          const { data: sessionData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (sessionData.session) {
            router.push(redirectTo);
            return;
          }
        }

        setError('Check your email for a confirmation link.');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          router.push(redirectTo);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      if (message.includes('Email rate limit')) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (mode === 'signup') {
        setError(
          'We could not complete sign up with those details. If you already have an account, try logging in instead.'
        );
      } else {
        setError('Invalid email or password. Please try again.');
      }
      if (process.env.NODE_ENV !== 'production') {
        console.error('Auth error:', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">ReachBoard</span>
            <span className="text-sm text-white/40">India</span>
          </Link>
          <h1 className="text-2xl font-bold">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {mode === 'signup'
              ? 'Join India\u2019s verified creator leaderboard'
              : 'Sign in to manage your dashboard'}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-5 border border-neutral-800">
          {mode === 'signup' && (
            <div>
              <Label className="text-white/70 text-sm mb-2 block">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    role === 'creator'
                      ? 'border-violet-500 bg-violet-600/20 text-white'
                      : 'border-neutral-800 bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-sm font-medium">Creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('brand')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    role === 'brand'
                      ? 'border-violet-500 bg-violet-600/20 text-white'
                      : 'border-neutral-800 bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Brand</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label className="text-white/70 text-sm">
                  {role === 'creator' ? 'Display Name' : 'Brand / Company Name'}
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={role === 'creator' ? 'Your name' : 'Brand name'}
                    className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 pl-10"
                    minLength={2}
                    maxLength={60}
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-white/70 text-sm">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 pl-10"
                  maxLength={255}
                />
              </div>
            </div>

            <div>
              <Label className="text-white/70 text-sm">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 pl-10"
                  minLength={6}
                  maxLength={100}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {loading
                ? 'Please wait...'
                : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-white/50">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to ReachBoard?{' '}
                <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium">
                  Create an account
                </Link>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-4">
          By continuing, you agree to ReachBoard&apos;s Terms of Service.
        </p>
      </div>
    </div>
  );
}
