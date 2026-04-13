import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

/**
 * 👥 Admin User Management (Supabase Version)
 */

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (role) query = query.eq('role', role);

    const { data: users, error: fetchError } = await query;
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });

    console.log(`[AdminAPI] Fetched ${users?.length} users. First user certs:`, users?.[0]?.certifications);

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { engineer_id, approved, reason } = await request.json();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_approved: approved,
        is_verified: approved,
        rejection_reason: approved ? null : reason
      })
      .eq('id', engineer_id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    // Send Notification to Engineer
    await supabase.from('notifications').insert({
      user_id: engineer_id,
      type: approved ? 'profile_approved' : 'profile_rejected',
      message: approved 
        ? "Your account has been approved! You can now start bidding on projects." 
        : `Your account verification failed. Reason: ${reason}`
    });

    return NextResponse.json({ message: `Engineer ${approved ? 'approved' : 'rejected'}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
