import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

/**
 * 🏗️ Project Operations API (Supabase Version)
 * View details, Update status, Delete project
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*, customer:profiles!customer_id(*)')
      .eq('id', params.id)
      .single();

    if (fetchError) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { status } = await request.json();

    // Verify ownership
    const { data: project } = await supabase.from('projects').select('customer_id').eq('id', params.id).single();
    if (!project || project.customer_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({ project: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
