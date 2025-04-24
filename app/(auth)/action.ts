'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/getUrl'
import { z } from 'zod'

export type LoginState = {
  errors?: {
    email?: string[]
    password?: string[]
  }
  message?: string | null
}

export type State = {
  errors?: {
    email?: string[]
    user_name?: string[]
    password?: string[]
    confirmPassword?: string[]
  }
  message?: string | null
}

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
      message:
        'Invalid Password (must contain uppercase, lowercase, number, and special character)',
    }),
})

export async function login(prevState: LoginState, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Please check your inputs.',
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  })

  if (error) {
    return {
      errors: {
        email: ['Invalid email or password'],
      },
      message: 'Invalid fields. Please check your inputs.',
    }
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
        'Password must contain uppercase, lowercase, number, and special character',
    }),
  confirmPassword: z.string(),
})

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
        email: [error.message],
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

export type ResetPasswordState = {
  errors?: {
    email?: string[]
  }
  message?: string | null
}

const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
})

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData
) {
  const supabase = await createClient()

  const validatedFields = resetPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Please check your inputs.',
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    validatedFields.data.email
  )

  if (error) {
    return {
      errors: {
        email: [error.message],
      },
      message: 'Failed to reset password',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/signup/confirm')
}

export type UpdatePasswordState = {
  errors?: {
    password?: string[]
    confirmPassword?: string[]
  }
  message?: string | null
}

const updatePasswordSchema = z.object({
  password: z
    .string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
      message:
        'Password must contain uppercase, lowercase, number, and special character',
    }),
  confirmPassword: z.string(),
})
export async function updatePassword(
  prevState: UpdatePasswordState,
  formData: FormData
) {
  const supabase = await createClient()

  const validatedFields = updatePasswordSchema.safeParse({
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

  const { error } = await supabase.auth.updateUser({
    password: validatedFields.data.password,
  })

  if (error) {
    return {
      errors: {
        password: [error.message],
      },
      message: 'Failed to update password',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
