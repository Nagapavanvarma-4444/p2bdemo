import { createClient } from './supabase-server';
import { NextResponse } from 'next/server';

/**
 * 🔒 Central Authentication Guard (Next.js 16 Secure)
 * Validates session from cookies and ensures profile synchronization.
 */
export async function requireAuth(request: Request) {
  try {
    // 0. 🔐 MASTER ADMIN BYPASS (Allow token-based entry)
    const authHeader = request.headers.get('Authorization');
    if (authHeader === 'Bearer master_admin_token_active') {
       return { 
         user: { 
           id: "ad000000-0000-0000-0000-000000000001", 
           email: "admin@p2b.com", 
           name: "Master Admin", 
           role: "admin" 
         }, 
         error: null 
       };
    }

    const supabase = await createClient();
    
    // 1. Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        user: null, 
        error: NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 }) 
      };
    }

    // 2. Fetch profile to get the CORRECT role from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
       // If no profile exists, we use the auth metadata as a fallback
       return { 
         user: { ...user, role: (user as any).user_metadata?.role || 'customer' }, 
         error: null 
       };
    }
    
    // Standardize role to lowercase for consistency
    const standardizedRole = (profile.role || 'customer').toLowerCase();
    
    return { user: { ...user, ...profile, role: standardizedRole }, error: null };
  } catch (err: any) {
    return { 
      user: null, 
      error: NextResponse.json({ error: 'Internal Server Error during Auth' }, { status: 500 }) 
    };
  }
}
