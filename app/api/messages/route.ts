import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 💬 Messaging API (v4.0 - INSTANT CONNECTION)
 * Automatically includes project partners from accepted proposals.
 */

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');

    const supabase = await createClient();

    if (recipientId) {
      // 1. Fetch chat history
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select(`*, sender:profiles!sender_id(name, avatar_url, role)`)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
      return NextResponse.json({ messages });
    } else {
      // 2. Fetch both active chats AND accepted partners
      const [messagesRes, acceptedRes] = await Promise.all([
        // Active Chats
        supabase
          .from('messages')
          .select(`*, sender:profiles!sender_id(id, name, avatar_url, role), receiver:profiles!receiver_id(id, name, avatar_url, role)`)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        
        // Accepted Proposals (To auto-create conversation slots)
        supabase
          .from('proposals')
          .select(`*, engineer:profiles!engineer_id(id, name, avatar_url, role), project:projects(customer_id, title, customer:profiles!customer_id(id, name, avatar_url, role))`)
          .eq('status', 'accepted')
          .or(`engineer_id.eq.${user.id},project_id.in.(select id from projects where customer_id = '${user.id}')`)
      ]);

      if (messagesRes.error) return NextResponse.json({ error: messagesRes.error.message }, { status: 400 });

      const partnersMap = new Map();

      // i. Process Accepted Bids (Placeholder connections)
      (acceptedRes.data || []).forEach(p => {
        const isCustomer = (p.project as any)?.customer_id === user.id;
        const partner = isCustomer ? p.engineer : (p.project as any).customer;
        
        if (partner && !partnersMap.has(partner.id)) {
          partnersMap.set(partner.id, {
            partner,
            lastMessage: `Deal accepted! Start your discussion for "${p.project?.title}"`,
            timestamp: p.updated_at,
            isNewConnection: true
          });
        }
      });

      // ii. Process Real Messages (Merge and overwrite placeholders with real text)
      (messagesRes.data || []).forEach(m => {
        const partner = m.sender_id === user.id ? m.receiver : m.sender;
        if (!partnersMap.has(partner.id) || !partnersMap.get(partner.id).isNewConnection) {
            // Only add/update if it's the most recent interaction
            if (!partnersMap.has(partner.id) || new Date(m.created_at) > new Date(partnersMap.get(partner.id).timestamp)) {
                partnersMap.set(partner.id, {
                   partner,
                   lastMessage: m.content,
                   timestamp: m.created_at,
                   isNewConnection: false
                });
            }
        } else {
            // If we have a real message, replace the "Deal accepted" placeholder
            partnersMap.set(partner.id, {
                partner,
                lastMessage: m.content,
                timestamp: m.created_at,
                isNewConnection: false
            });
        }
      });

      const finalConvos = Array.from(partnersMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return NextResponse.json({ conversations: finalConvos });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { recipient_id, content } = await request.json();
    const supabase = await createClient();

    const { data: msg, error: sendError } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: recipient_id, content, read: false })
      .select()
      .single();

    if (sendError) return NextResponse.json({ error: sendError.message }, { status: 400 });
    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
