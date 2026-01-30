import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Not authenticated',
      authError
    });
  }

  // Try to get the profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Also try a raw query to check what's in the database
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('id, email, is_admin');

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    profileError,
    allProfiles,
    allProfilesError,
    isAdmin: profile?.is_admin,
  });
}
