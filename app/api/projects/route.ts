import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';

/**
 * 🏗️ Projects API (Ultimate Secure Version)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = supabase
      .from('projects')
      .select('*, customer:profiles!customer_id(*)');

    if (category) query = query.eq('category', category);
    
    const { data: projects, error } = await query.order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. SECURE AUTH: Get user from cookies
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { title, description, category, location, budget, budget_min, budget_max, timeline } = body;

    // Handle flexible budget input
    const final_budget_min = budget_min !== undefined ? budget_min : (budget || 0);
    const final_budget_max = budget_max !== undefined ? budget_max : (budget ? budget * 1.5 : 0);
    const final_timeline = timeline || "Not specified";

    // 2. SECURE CLIENT: Use the server-side client with the user's session
    const supabase = await createClient();

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        customer_id: user.id,
        title,
        description,
        category,
        location,
        budget_min: final_budget_min,
        budget_max: final_budget_max,
        timeline: final_timeline,
        status: 'open'
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ [Projects API] Insert Error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: any) {
    console.error("❌ [Projects API] Unexpected Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
