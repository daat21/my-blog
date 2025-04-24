'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/getUrl'
import { z } from 'zod'

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

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  user_name: z
    .string()
    .min(5, { message: 'Username must be at least 5 characters long' }),
  password: z
    .string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  confirmPassword: z.string(),
})

export type State = {
  errors?: {
    email?: string[]
    user_name?: string[]
    password?: string[]
    confirmPassword?: string[]
  }
  message?: string | null
}

export async function signup(prevState: State, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    user_name: formData.get('user_name'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirm-password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Please check your inputs.',
    }
  }

  if (validatedFields.data.password !== validatedFields.data.confirmPassword) {
    return {
      errors: {
        password: ['Passwords do not match'],
        confirmPassword: ['Passwords do not match'],
      },
      message: 'Invalid fields. Please check your inputs.',
    }
  }

  const data = {
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    options: {
      data: {
        user_name: formData.get('user_name') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return {
      errors: {
        email: ['Email already in use'],
      },
      message: 'Invalid fields. Please check your inputs.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/signup/confirm')
}

export async function signInWithGithub() {
  const supabase = await createClient()

  const siteUrl = await getSiteUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${siteUrl}/callback`,
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
