'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type State = {
  message: string | null
  errors?: {
    name?: string[]
    email?: string[]
    message?: string[]
  }
}

const FormSchema = z.object({
  name: z.string().min(1, { message: 'Name must be at least 1 character.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  message: z
    .string()
    .min(1, { message: 'Message must be at least 1 character.' })
    .max(500, { message: 'Message must be less than 500 characters.' }),
})

export async function contactFormAction(prevState: State, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = FormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: null,
    }
  }

  const { name, email, message } = validatedFields.data

  const { error } = await supabase
    .from('guestbook_entries')
    .insert([{ name, email, message }])

  if (error) {
    return { message: 'Message sent unsuccessfully.' }
  }

  return { message: 'Message sent successfully.' }
}
