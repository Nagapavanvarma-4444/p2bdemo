import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 📊 Admin Stats & Settings (v2.0 - Server Secure)
 */
export async function GET(request: Request) {
  try {
    const { user, error: authErr } = await requireAuth(request);
    if (authErr) return authErr;
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const supabase = await createClient();

    // Parallel fetch for speed
    const [profilesCount, projectsCount, pendingCount, settingsResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'engineer').eq('is_approved', false),
      supabase.from('system_settings').select('*').limit(1).maybeSingle()
    ]);

    return NextResponse.json({
      stats: {
        total_users: profilesCount.count || 0,
        total_projects: projectsCount.count || 0,
        pending_approvals: pendingCount.count || 0,
      },
      settings: {
        maintenance_mode: settingsResult.data?.maintenance_mode || false,
        id: settingsResult.data?.id || 1
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user, error: authErr } = await requireAuth(request);
    if (authErr) return authErr;
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { maintenance_mode } = await request.json();
    const supabase = await createClient();

    // Ensure we update or create the global settings row (id 1)
    const { data: updated, error: updateError } = await supabase
      .from('system_settings')
      .upsert({ id: 1, maintenance_mode, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({ message: 'System maintenance status updated successfully', settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
