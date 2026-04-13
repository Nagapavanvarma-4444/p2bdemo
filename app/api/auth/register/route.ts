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
    let formData: FormData | null = null;

    if (contentType.includes('multipart/form-data')) {
      formData = await request.formData();
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
        // Trigger public.handle_new_user() expects 'name' in metadata
        data: { name: name, full_name: name, role: role }
      }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    if (!authData.user) return NextResponse.json({ error: 'Registration failed' }, { status: 400 });

    // -- CERTIFICATE UPLOAD LOGIC (Moved after signUp to use User ID) --
    let certificateUrls: string[] = [];
    if (formData && role === 'engineer') {
      const files = formData.getAll('certificates') as File[];
      console.log(`[Register] Attempting to upload ${files.length} certificates for engineer ${authData.user.id}`);
      
      for (const file of files) {
        if (file.size > 0) {
          const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
          // Folder nested under user ID for security
          const filePath = `${authData.user.id}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('engineer-documents')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error(`[Register] Upload error for ${file.name}:`, uploadError);
            continue;
          }
          
          if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('engineer-documents')
              .getPublicUrl(uploadData.path);
            certificateUrls.push(publicUrl);
            console.log(`[Register] Uploaded: ${publicUrl}`);
          }
        }
      }
    }

    // 2. Create Profile (The Trigger handles this, but we update extra fields if needed)
    console.log(`[Register] Updating profile for ${authData.user.id} with ${certificateUrls.length} certs`);
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name,
        phone,
        location,
        role,
        bio,
        category,
        certifications: certificateUrls, // Save uploaded file URLs
        experience_years: experience_years ? parseInt(experience_years) : null,
        is_approved: role === 'customer' // Customers auto-approved
      })
      .eq('id', authData.user.id);

    if (profileError) {
        console.error('[Register] Profile update error:', profileError);
    } else {
        console.log('[Register] Profile updated successfully');
    }

    // 3. Fetch Full Profile to return to client
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return NextResponse.json({ 
      message: 'Registration successful!', 
      token: authData.session?.access_token || null,
      user: { ...authData.user, ...profile }
    }, { status: 201 });

  } catch (err: any) {
    console.error('Registration Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
