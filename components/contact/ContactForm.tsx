'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useActionState, useState, useTransition } from 'react'
import { contactFormAction, State } from '@/app/(home)/contact/action'
import { Loader2 } from 'lucide-react'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const initialState: State = { message: null, errors: {} }
  const [state, formAction] = useActionState(contactFormAction, initialState)
  const [isPending, startTransition] = useTransition()
  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Card className="relative w-full overflow-hidden">
      <form action={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  aria-describedby="name-error"
                  disabled={isPending}
                />
              </div>
              <div id="name-error" aria-live="polite" aria-atomic="true">
                {state.errors?.name &&
                  state.errors.name.map((error: string) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
              </div>
            </div>
            <div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  aria-describedby="email-error"
                  disabled={isPending}
                />
              </div>
              <div id="email-error" aria-live="polite" aria-atomic="true">
                {state.errors?.email &&
                  state.errors.email.map((error: string) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
              </div>
            </div>
            <div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Your Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  className="h-24"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  aria-describedby="message-error"
                  disabled={isPending}
                />
              </div>
              <div id="message-error" aria-live="polite" aria-atomic="true">
                {state.errors?.message &&
                  state.errors.message.map((error: string) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
        {state.message && (
          <CardFooter className="flex justify-end">
            <p className="text-green-500">{state.message}</p>
          </CardFooter>
        )}
        <CardFooter className="mt-4 flex justify-end">
          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Sending...' : 'Send'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
