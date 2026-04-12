import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 📑 Project Proposals API (Secure Supabase Version)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> } // Params is a Promise
) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { projectId } = await params; // 👈 UNWRAP
    const supabase = await createClient();

    const { data: proposals, error: fetchError } = await supabase
      .from('proposals')
      .select('*, engineer:profiles!engineer_id(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    return NextResponse.json({ proposals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
