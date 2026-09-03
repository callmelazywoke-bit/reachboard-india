'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, LayoutDashboard, LogOut, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.push('/');
  };

  return (
    <header className="relative z-30 border-b border-white/5 backdrop-blur-md bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">ReachBoard</span>
          <span className="text-xs text-white/40 hidden sm:inline">India</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/#leaderboard">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">
                  Leaderboard
                </Button>
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-xs font-bold">
                    {(user.username || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-white/80">
                  {user.role === 'brand' ? user.full_name || user.username : `@${user.username}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-white/50 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/#leaderboard">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">
                  Leaderboard
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white/70 hover:text-white p-2"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-2 bg-[#0B0F17]">
          {user ? (
            <>
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-xs font-bold">
                    {(user.username || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium">
                  {user.role === 'brand' ? user.full_name || user.username : `@${user.username}`}
                </span>
              </div>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/#leaderboard" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white">
                  Leaderboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-white/70 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/#leaderboard" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white">
                  Leaderboard
                </Button>
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
