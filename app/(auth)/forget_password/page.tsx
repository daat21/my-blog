'use client'

import { ShineBorder } from '@/components/magicui/shine-border'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { resetPassword, ResetPasswordState } from '@/app/(auth)/action'
import { useTransition, useState, useActionState } from 'react'
import { Loader2 } from 'lucide-react'

export default function ForgetPasswordPage() {
  const initialState: ResetPasswordState = {
    errors: {},
    message: null,
  }
  const [state, formAction] = useActionState(resetPassword, initialState)

  const [email, setEmail] = useState('')

  const [isPending, startTransition] = useTransition()
  const handleResetPassword = (formData: FormData) => {
    startTransition(() => {
      formAction(formData)
    })
  }
  return (
    <Card className="relative w-full max-w-[350px] overflow-hidden">
      <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleResetPassword}>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="Email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isPending}
                aria-describedby="email-error"
              />
              <Button variant="outline" type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Sending Reset Link...' : 'Send Reset Link'}
              </Button>
            </div>
            <div id="form-error" aria-live="polite" aria-atomic="true">
              {state.message && (
                <p className="text-sm text-red-500">{state.message}</p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
