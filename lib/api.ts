import { supabase } from './supabase';

/**
 * 🌐 Unified API Connector (v3.0 - RENAMED TO FORCE SYNC)
 * [MARK]: P2B_API_MASTER_V3
 */
export async function p2b_api_call(endpoint: string, options: any = {}) {
  console.log("💎 [P2B_API_v3] Calling:", endpoint);

  let url = endpoint;
  if (!url.startsWith('http') && !url.startsWith('/api')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // 1. Resolve Auth Token
  let token = localStorage.getItem('p2b_token');
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || null;
  }
  
  const headers: any = { ...options.headers };

  // 2. Intelligent Content-Type
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const body = options.body instanceof FormData 
    ? options.body 
    : (options.body ? JSON.stringify(options.body) : undefined);

  const response = await fetch(url, {
    ...options,
    headers,
    body
  });

  // 3. Handle Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('p2b_user');
    localStorage.removeItem('p2b_token');
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login?error=Session Expired';
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'API Error');
    return data;
  }
  
  const text = await response.text();
  if (!response.ok) throw new Error(text || 'API Error');
  return text;
}

// Legacy export to prevent immediate crashes, but it will log a warning
export const apiCall = p2b_api_call;
