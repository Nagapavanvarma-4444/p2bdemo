import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 1. Get current session
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Proactive Maintenance Mode Check (High Potential Logic)
  // We check the system_settings table directly at the edge
  try {
    const { data: settings } = await supabase
      .from('system_settings')
      .select('maintenance_mode')
      .single();

    const isMaintenance = settings?.maintenance_mode;

    // 3. Logic: If maintenance is ON and user is NOT an admin, block access
    // We strictly check the profile to see if they are an admin
    if (isMaintenance && !request.nextUrl.pathname.startsWith('/auth/login')) {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role !== 'admin' && !request.nextUrl.pathname.startsWith('/maintenance')) {
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      } else {
        // If no user and maintenance is on, redirect all to maintenance
        if (!request.nextUrl.pathname.startsWith('/maintenance') && !request.nextUrl.pathname.startsWith('/auth')) {
            return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      }
    }
  } catch (e) {
    // Error in settings check, continue as normal to prevent site crash
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
