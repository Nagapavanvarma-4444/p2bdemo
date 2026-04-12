import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 📑 Proposals API (Ultimate Secure Version)
 */

// POST - Send a proposal (As Engineer)
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;
    
    const userRole = user.role?.toLowerCase();
    if (userRole !== 'engineer') {
        return NextResponse.json({ error: `Only engineers can send proposals (You are a ${user.role})` }, { status: 403 });
    }

    const data = await request.json();
    const { project_id, cover_letter, price, timeline } = data;

    const supabase = await createClient();
    const { data: proposal, error: insertError } = await supabase
      .from('proposals')
      .insert({
        project_id,
        engineer_id: user.id,
        cover_letter,
        price,
        timeline,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') return NextResponse.json({ error: 'You have already submitted a proposal for this project' }, { status: 409 });
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Proposal sent successfully', proposal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Proposals list (Intelligent Role Detection)
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const supabase = await createClient();
    const userRole = user.role?.toLowerCase();

    if (userRole === 'engineer') {
      // Fetch proposals I SENT (Include project customer_id for chatting)
      const { data: proposals, error: fetchError } = await supabase
        .from('proposals')
        .select('*, project:projects(title, category, location, customer_id)')
        .eq('engineer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
      return NextResponse.json({ proposals });
    } else {
      // Fetch proposals I RECEIVED (As Customer)
      // 1. Get my projects
      const { data: myProjects } = await supabase.from('projects').select('id').eq('customer_id', user.id);
      const projectIds = (myProjects || []).map((p: any) => p.id);

      // 2. Get proposals for those projects
      const { data: proposals, error: fetchError } = await supabase
        .from('proposals')
        .select('*, engineer:profiles!engineer_id(*), project:projects(title)')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
      return NextResponse.json({ proposals });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update proposal status handled in [id]/route.ts
