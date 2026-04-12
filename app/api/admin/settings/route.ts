import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 🛠️ Admin Settings API
 * Allows administrators to toggle global system settings (e.g. Maintenance Mode)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    // Verify Admin status
    const supabase = await createClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    const { maintenance_mode } = await request.json();

    const { data: updated, error: updateError } = await supabase
      .from('system_settings')
      .update({ maintenance_mode, updated_at: new Date().toISOString() })
      .eq('id', 1) // Standard ID for global settings
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({ message: 'Settings updated successfully', settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
