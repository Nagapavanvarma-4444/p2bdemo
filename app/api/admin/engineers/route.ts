import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 👷 Admin Engineer Verification API (v2.0 - Master Sync)
 */
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    // Direct trust for Admin role (handles Master Bypass automatically)
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const supabase = await createClient();
    
    // List engineers waiting for approval
    const { data: engineers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'engineer')
      // Removed the 'is_approved' filter to show ALL engineers in management
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ engineers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    if (user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { engineer_id, status, reason } = await request.json();
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        is_approved: status === 'approved',
        is_verified: status === 'approved', // Sync both flags
        bio: status === 'rejected' ? `Rejected: ${reason}` : undefined
      })
      .eq('id', engineer_id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    // Notify the engineer
    await supabase.from('notifications').insert({
      user_id: engineer_id,
      type: 'verification_update',
      message: status === 'approved' 
        ? 'Congratulations! Your profile has been approved.' 
        : `Verification update: ${reason}`,
      link: '/dashboard/engineer'
    });

    return NextResponse.json({ message: `Success` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
