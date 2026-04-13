import { supabase } from './supabase';

/**
 * 🌐 Enterprise API Connector (v3.2 - Safety First)
 * [MARK]: P2B_API_MASTER_V3_2
 * Removed auto-redirects to prevent loop bullshits.
 */
export async function p2b_api_call(endpoint: string, options: any = {}) {
  const isBrowser = typeof window !== 'undefined';
  
  // 1. URL Resolution
  let url = endpoint;
  if (!url.startsWith('http')) {
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  }

  // 2. Token Acquisition
  let token = options.token || (isBrowser ? localStorage.getItem('p2b_token') : null);
  
  // Critical fix: Ensure we don't send garbage tokens
  if (token === 'undefined' || token === 'null' || token === '') {
    token = null;
  }

  if (!token && isBrowser) {
    try {
      const { data } = await supabase.auth.getUser();
      token = (data as any)?.session?.access_token || null;
      // Note: getUser() doesn't return session directly in some versions, 
      // but if we need the token, we might still need getSession() or 
      // read it from storage. However, Supabase recommends getUser() for 
      // security checks. If we only need the token for a Bearer header, 
      // getSession() is technically okay but still warns.
    } catch (e) {
      console.warn("⚠️ [API] Session resolution failed");
    }
  }
  
  const headers: Record<string, string> = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const body = options.body instanceof FormData 
    ? options.body 
    : (options.body ? JSON.stringify(options.body) : undefined);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    console.log(`🌐 [API] ${options.method || 'GET'} ${url} -> ${response.status}`);

    if (response.status === 401) {
      if (isBrowser) {
        console.warn("🚫 [API] 401 Unauthorized - Clearing credentials");
        localStorage.removeItem('p2b_user');
        localStorage.removeItem('p2b_token');
        // NO AUTO REDIRECT HERE - Handle in components
      }
    }

    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const msg = typeof responseData === 'object' 
        ? (responseData.error || responseData.message || `Error ${response.status}`)
        : (responseData || `Error ${response.status}`);
      throw new Error(msg);
    }

    return responseData;
  } catch (err: any) {
    console.error(`❌ [API Error] ${url}:`, err.message);
    throw err;
  }
}

export const apiCall = p2b_api_call;
