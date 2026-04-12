import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 🔍 Discovery API (Supabase Version)
 * Publicly searchable list of engineers/professionals
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');

    let query = supabase
      .from('profiles')
      .select('id, name, avatar_url, category, experience_years, bio, average_rating, is_verified')
      .eq('role', 'engineer')
      .eq('is_approved', true) // Only show verified professionals
      .order('average_rating', { ascending: false });

    if (category) query = query.eq('category', category);
    if (location) query = query.ilike('location', `%${location}%`);

    const { data: engineers, error: fetchError } = await query;

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });

    return NextResponse.json({ engineers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
