import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 📋 My Projects API (Secure Server Version)
 * Fetches projects belonging to the logged-in customer
 */
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const supabase = await createClient();
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select(`
        *,
        proposals_count:proposals(count)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });

    // Format for frontend
    const formatted = projects.map(p => ({
      ...p,
      proposals_count: p.proposals_count?.[0]?.count || 0
    }));

    return NextResponse.json({ projects: formatted });
  } catch (err: any) {
    console.error("My Projects API Crash:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
