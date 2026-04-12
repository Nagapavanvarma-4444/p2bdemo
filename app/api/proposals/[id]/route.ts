import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 📑 Proposal Detail API (v2.1 - REALITY CHECK)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🏁 [API] PROPOSAL DECISION (v2.1) STARTING...");
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { status } = await request.json();
    const { id: proposalId } = await params; // 👈 ASYNC UNWRAP (REQUIRED)
    
    console.log(`🚀 [API] Processing ${status} for Proposal:`, proposalId);

    const supabase = await createClient();

    // 1. Fetch proposal details
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*, project:projects!project_id(customer_id, title)')
      .eq('id', proposalId)
      .single();

    if (fetchError || !proposal) {
        console.error("❌ [API] Proposal Not Found:", proposalId);
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Security check
    if ((proposal.project as any).customer_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized: Ownership mismatch' }, { status: 403 });
    }

    // 2. Update status
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status })
      .eq('id', proposalId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    // 3. Status side-effects
    if (status === 'accepted') {
      await supabase.from('projects').update({ status: 'in_progress' }).eq('id', proposal.project_id);
      
      const { data: propDetails } = await supabase.from('proposals').select('engineer_id').eq('id', proposalId).single();
      if (propDetails) {
          await supabase.from('notifications').insert({
            user_id: propDetails.engineer_id,
            type: 'proposal_accepted',
            message: `🎉 Good news! Your proposal for "${proposal.project?.title}" was accepted!`,
            link: '/messages'
          });
      }
    }

    console.log("✅ [API] SUCCESS:", status);
    return NextResponse.json({ message: 'Success', status });
  } catch (err: any) {
    console.error("🔥 [API] CRITICAL ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
