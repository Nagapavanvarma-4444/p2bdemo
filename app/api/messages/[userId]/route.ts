import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

/**
 * 💬 Chat History API (Supabase Version)
 * Fetches all messages between the logged-in user and a specific contact
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const contactId = params.userId;

    // Fetch messages in both directions
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });

    // Mark messages from contact as "read"
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', contactId)
      .eq('receiver_id', user.id);

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
