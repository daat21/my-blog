'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ShineBorder } from '@/components/magicui/shine-border'
import { Label } from '@/components/ui/label'
import { updatePassword, UpdatePasswordState } from '../action'
import { useState, useTransition, useActionState } from 'react'
import { Loader2 } from 'lucide-react'

export default function UpdatePasswordPage() {
  const initialState: UpdatePasswordState = {
    errors: {},
    message: null,
  }
  const [state, formAction] = useActionState(updatePassword, initialState)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isPending, startTransition] = useTransition()
  const handleUpdatePassword = (formData: FormData) => {
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
        <form action={handleUpdatePassword}>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-describedby="password-error"
                />
                <div id="password-error" aria-live="polite" aria-atomic="true">
                  {state.errors?.password &&
                    state.errors.password.map((error: string) => (
                      <p className="mt-2 text-sm text-red-500" key={error}>
                        {error}
                      </p>
                    ))}
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                </div>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  aria-describedby="confirm-password-error"
                />
                <div
                  id="confirm-password-error"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {state.errors?.confirmPassword &&
                    state.errors.confirmPassword.map((error: string) => (
                      <p className="mt-2 text-sm text-red-500" key={error}>
                        {error}
                      </p>
                    ))}
                </div>
              </div>

              <Button variant="outline" type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
