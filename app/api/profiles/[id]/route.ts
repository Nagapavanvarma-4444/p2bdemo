import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * 👤 Profile Fetch API
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
