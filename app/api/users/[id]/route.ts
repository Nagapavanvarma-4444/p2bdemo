import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * 👤 User Profile API (v2.0 - Next.js 16 Secure)
 * Fetches public profile details for an engineer or customer
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params is a Promise
) {
  try {
    const { id: userId } = await params; // 👈 UNWRAP
    const supabase = await createClient();

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
