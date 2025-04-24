'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/getUrl'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error)
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm-password') as string

  if (password !== confirmPassword) {
    redirect('/signup?error=passwords_mismatch')
  }

  const data = {
    email: formData.get('email') as string,
    password: password,
    options: {
      data: {
        user_name: formData.get('user_name') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup error:', error)
    redirect('/signup?error=signup_error')
  }

  revalidatePath('/', 'layout')
  redirect('/signup/confirm')
}

export async function signInWithGithub() {
  const supabase = await createClient()

  const siteUrl = await getSiteUrl()
  const redirectURL = `${siteUrl}/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectURL,
    },
  })

  if (error) {
    console.error('Github sign in error:', error)
    redirect('/error')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error('Reset password error:', error)
  }

  revalidatePath('/', 'layout')
  redirect('/signup/confirm')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm-password') as string

  if (password !== confirmPassword) {
    redirect('/signup?error=passwords_mismatch')
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error('Signup error:', error)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
