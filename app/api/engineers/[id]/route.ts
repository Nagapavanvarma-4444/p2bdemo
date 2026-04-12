import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * 👷 Engineer Detail API (Secure Supabase Version)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params is a Promise
) {
  try {
    const { id: engineerId } = await params; // 👈 UNWRAP
    const supabase = await createClient();

    // Fetch profile and reviews
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, reviews:reviews!engineer_id(*, customer:profiles!customer_id(name))')
      .eq('id', engineerId)
      .eq('role', 'engineer')
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 });
    }

    return NextResponse.json({ engineer: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
