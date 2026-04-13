import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

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
      // 🔐 MANUALLY SET SESSION COOKIES for Master Admin
      const cookieStore = await cookies();
      cookieStore.set('p2b_admin_active', 'true', { path: '/', httpOnly: true, maxAge: 86400 });
      
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

    // 3. Fetch Profile (to check for admin status)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // 4. Maintenance Check (Allow Admins)
    const { data: maintenance } = await supabase
      .from('system_settings')
      .select('maintenance_mode')
      .single();
    
    // 🔐 ROBUST ADMIN RECOGNITION
    const profileRole = (profile?.role || '').trim().toLowerCase();
    const metadataRole = (authData.user?.user_metadata?.role || '').trim().toLowerCase();
    const userEmail = (authData.user?.email || '').toLowerCase();
    
    // An admin can be identified by:
    // 1. Role in profile table
    // 2. Role in Supabase metadata
    // 3. Known admin email suffixes (Optional: helpful for this specific user's issue)
    const masterAdminId = "ad000000-0000-0000-0000-000000000001";
    const hasAdminCookie = (await cookies()).get('p2b_admin_active')?.value === 'true';
    const isAdmin = profile?.role?.toLowerCase() === 'admin' || authData.user?.user_metadata?.role === 'admin' || authData.user.id === masterAdminId || hasAdminCookie;
    
    // Allow Admins to bypass maintenance mode
    if (maintenance?.maintenance_mode && !isAdmin) {
      console.log(`🚫 [Auth] Blocked ${userEmail} (Not Admin) during maintenance.`);
      await supabase.auth.signOut();
      return NextResponse.json({ 
        error: 'System is under maintenance.',
        message: 'PLAN 2 BUILD is currently undergoing scheduled maintenance. Only administrators can access the system at this time.'
      }, { status: 503 });
    }
    
    // Set a helper cookie for proxy.ts to know this session IS an admin bypass
    if (isAdmin) {
        const cookieStore = await cookies();
        cookieStore.set('p2b_admin_active', 'true', { path: '/', httpOnly: true });
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
