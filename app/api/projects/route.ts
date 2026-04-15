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

    const contentType = request.headers.get('content-type') || '';
    let title, description, category, location, budget, budget_min, budget_max, timeline;
    let attachment_url = null;

    const supabase = await createClient();

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = formData.get('title') as string;
      description = formData.get('description') as string;
      category = formData.get('category') as string;
      location = formData.get('location') as string;
      budget = formData.get('budget');
      budget_min = formData.get('budget_min');
      budget_max = formData.get('budget_max');
      timeline = formData.get('timeline') as string;

      const file = formData.get('attachment') as File;
      if (file && file.size > 0) {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(uploadData.path);
          attachment_url = publicUrl;
        } else {
          console.error("❌ [Projects API] File upload failed:", uploadError);
        }
      }
    } else {
      const body = await request.json();
      ({ title, description, category, location, budget, budget_min, budget_max, timeline, attachment_url } = body);
    }

    // Handle flexible budget input
    const parseBudget = (val: any) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const final_budget_min = parseBudget(budget_min) ?? parseBudget(budget) ?? 0;
    const final_budget_max = parseBudget(budget_max) ?? (parseBudget(budget) ? (parseBudget(budget)! * 1.5) : 0);
    const final_timeline = timeline || "Not specified";

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
        attachment_url: attachment_url,
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
