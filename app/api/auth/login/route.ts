import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * 🔐 Login API (Secure Server Session Version)
 * Now correctly sets Auth Cookies for Next.js 16/15
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 0. 🔐 MASTER ADMIN BYPASS (Change these for production!)
    const MASTER_ADMIN_EMAIL = "admin@p2b.com";
    const MASTER_ADMIN_PASS = "admin_p2b_2024";

    if (email === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASS) {
      return NextResponse.json({
        token: "master_admin_token_active",
        user: { 
          id: "ad000000-0000-0000-0000-000000000001", 
          email: MASTER_ADMIN_EMAIL, 
          name: "Master Admin", 
          role: "admin" 
        }
      });
    }

    // 1. Create the Server-Side Supabase Client (Handles Cookies!)
    const supabase = await createClient();

    // 2. Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });

    // 3. Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // 4. Maintenance Check
    const { data: maintenance } = await supabase
      .from('system_settings')
      .select('maintenance_mode')
      .single();
    
    if (maintenance?.maintenance_mode && profile?.role !== 'admin') {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'System is under maintenance.' }, { status: 503 });
    }

    // 5. Success - The cookies are already set in the response headers by createClient setAll
    return NextResponse.json({
      token: authData.session.access_token,
      user: { id: authData.user.id, email: authData.user.email, ...profile }
    });

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
