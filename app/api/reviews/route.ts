import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

/**
 * ⭐ Reviews API (Supabase Version)
 */

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { project_id, engineer_id, rating, comment } = await request.json();

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        project_id,
        customer_id: user.id,
        engineer_id,
        rating,
        comment
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

    // Update engineer's average rating
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('engineer_id', engineer_id);
    if (reviews) {
        const avg = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        await supabase.from('profiles').update({ average_rating: avg }).eq('id', engineer_id);
    }

    return NextResponse.json({ message: 'Review submitted successfully', review }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const engineer_id = searchParams.get('engineer_id');

    if (!engineer_id) return NextResponse.json({ error: 'engineer_id is required' }, { status: 400 });

    const { data: reviews, error: fetchError } = await supabase
      .from('reviews')
      .select('*, customer:profiles!customer_id(name, avatar_url)')
      .eq('engineer_id', engineer_id)
      .order('created_at', { ascending: false });

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });

    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
