'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function uploadAvatar(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/error/unauthorized')
  }

  // Get file from FormData
  const file = formData.get('avatarFile') as File | null

  if (!file || !(file instanceof File) || file.size === 0) {
    redirect('/error/no_file')
  }

  if (!file.type.startsWith('image/')) {
    redirect('/error/not_image')
  }

  // Optional: check file type and size
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    redirect('/error/file_too_large')
  }

  // Generate unique file path (use user ID + fixed file name, easy to cover)
  const fileExtension = file.name.split('.').pop()
  const newFileName = `avatar.${fileExtension}`
  const newFilePath = `${user.id}/${newFileName}` // For example: uuid-1234/avatar.png

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars') // Your storage bucket name
    .upload(newFilePath, file, {
      cacheControl: 'max-age=3600', // Cache control (optional)
      upsert: true, // Key: If file exists, overwrite, otherwise create
    })

  if (uploadError) {
    redirect('/error/upload_failed')
  }

  // Get public URL of uploaded file
  //     Note: Path needs to be exactly the same as when uploading
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(newFilePath)

  if (!urlData?.publicUrl) {
    // You can try to build URL directly, but getPublicUrl is the standard way
    // const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;
    // If getPublicUrl fails, it might be due to RLS or path issues, or file not fully processed
    redirect('/error/get_public_url_failed')
  }

  const publicUrl = urlData.publicUrl

  // (Optional) If you need to prevent old avatar URL caching, you can add a timestamp to the URL
  // const publicUrlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

  // Update avatar_url in profiles table
  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl, // Store public URL
      updated_at: new Date().toISOString(), // Update timestamp
    })
    .eq('id', user.id) // Ensure only current user's profile is updated

  if (dbError) {
    // Note: At this point, the file has been uploaded, but the database update failed, so you need to consider compensation logic or prompt the user
    redirect('/error/db_update_failed')
  }

  // --- Delete old avatars ---
  const userFolder = user.id
  const { data: fileList, error: listError } = await supabase.storage
    .from('avatars')
    .list(userFolder, {
      search: 'avatar.',
    })

  if (listError) {
  } else if (fileList) {
    const filesToDelete = fileList
      .filter(oldFile => oldFile.name !== newFileName)
      .map(oldFile => `${userFolder}/${oldFile.name}`)

    if (filesToDelete.length > 0) {
      const { error } = await supabase.storage
        .from('avatars')
        .remove(filesToDelete)

      if (error) {
        console.error('Error deleting old avatars:', error)
      }
    }
  }
  // --- End of deleting old avatars ---

  // Clear cache for related pages (important!)
  revalidatePath('/')
  redirect('/profiles')
}
