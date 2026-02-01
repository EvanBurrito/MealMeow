'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import CreatePlanChooserModal from '@/components/shared/CreatePlanChooserModal';

interface HeaderProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

export default function Header({ isLoggedIn = false, isAdmin = false }: HeaderProps) {
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🐱</span>
          <span className="text-2xl font-bold text-orange-500">MealMeow</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/database">
                <Button variant="ghost">Database</Button>
              </Link>
              <Link href="/community">
                <Button variant="ghost">Community</Button>
              </Link>
              <Button variant="ghost" onClick={() => setShowCreatePlanModal(true)}>
                + Create Plan
              </Button>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>

      {isLoggedIn && (
        <CreatePlanChooserModal
          isOpen={showCreatePlanModal}
          onClose={() => setShowCreatePlanModal(false)}
        />
      )}
    </header>
  );
}
