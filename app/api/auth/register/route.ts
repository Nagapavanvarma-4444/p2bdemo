import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * 📝 Secure Registration API (Supabase SSR Version)
 * Now ensures instant session establishment via Cookies
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let email, password, name, phone, location, role;
    let bio, category, experience_years;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
      name = formData.get('name') as string;
      phone = formData.get('phone') as string;
      location = formData.get('location') as string;
      role = formData.get('role') as string;
      bio = formData.get('bio') as string;
      category = formData.get('category') as string;
      experience_years = formData.get('experience_years') as string;
    } else {
      const json = await request.json();
      email = json.email;
      password = json.password;
      name = json.name;
      role = json.role;
      // ... capture others if needed
    }

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: `Missing fields: ${!email ? 'email ' : ''}${!password ? 'password ' : ''}${!name ? 'name ' : ''}${!role ? 'role ' : ''}` }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: role }
      }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    if (!authData.user) return NextResponse.json({ error: 'Registration failed' }, { status: 400 });

    // 2. Create Profile (The Trigger handles this, but we update extra fields if needed)
    // Wait for trigger to finish or handle manually
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name,
        phone,
        location,
        role,
        bio,
        category,
        experience_years: experience_years ? parseInt(experience_years) : null,
        is_approved: role === 'customer' // Customers auto-approved
      })
      .eq('id', authData.user.id);

    return NextResponse.json({ 
      message: 'Registration successful!', 
      user: authData.user 
    }, { status: 201 });

  } catch (err: any) {
    console.error('Registration Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
