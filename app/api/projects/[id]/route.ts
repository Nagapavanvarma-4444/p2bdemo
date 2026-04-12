import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 🏗️ Project Operations API (v2.0 - Next.js 16 Secure)
 * View details, Update status, Delete project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params is a Promise
) {
  try {
    const { id: projectId } = await params; // 👈 UNWRAP
    const supabase = await createClient();

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*, customer:profiles!customer_id(*)')
      .eq('id', projectId)
      .single();

    if (fetchError) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params is a Promise
) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { id: projectId } = await params; // 👈 UNWRAP
    const { status } = await request.json();

    const supabase = await createClient();

    // Verify ownership
    const { data: project } = await supabase.from('projects').select('customer_id').eq('id', projectId).single();
    if (!project || project.customer_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({ project: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
