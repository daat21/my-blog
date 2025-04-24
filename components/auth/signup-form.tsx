'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Github, Loader2 } from 'lucide-react'
import { ShineBorder } from '@/components/magicui/shine-border'
import { signup, State, signInWithGithub } from '@/app/(auth)/action'
import { useState, useActionState, useTransition } from 'react'

export function SignupForm({}: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('')
  const [user_name, setUser_name] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  const initialState: State = { message: null, errors: {} }
  const [state, formAction] = useActionState(signup, initialState)

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData)
    })
  }

  const handleSignUpWithGithub = () => {
    startTransition(() => {
      signInWithGithub()
    })
  }

  return (
    <Card className="relative w-full max-w-[350px] overflow-hidden">
      <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
      <CardHeader className="pb-0 text-center">
        <div className="text-left text-sm">
          <Link
            href="/login"
            className="font-semibold underline underline-offset-4"
          >
            {'< '}Back to login
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit}>
          <div className="grid gap-4">
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full"
                disabled={isPending}
                onClick={handleSignUpWithGithub}
              >
                <Github />
                Login with GitHub
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            <div className="grid gap-4">
              <div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    aria-describedby="email-error"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="user_name">Username</Label>
                  </div>
                  <Input
                    id="user_name"
                    name="user_name"
                    type="text"
                    aria-describedby="user_name-error"
                    value={user_name}
                    onChange={e => setUser_name(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div id="user_name-error" aria-live="polite" aria-atomic="true">
                  {state.errors?.user_name &&
                    state.errors.user_name.map((error: string) => (
                      <p className="mt-2 text-sm text-red-500" key={error}>
                        {error}
                      </p>
                    ))}
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    aria-describedby="password-error"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isPending}
                  />
                  <div
                    id="password-error"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {state.errors?.password &&
                      state.errors.password.map((error: string) => (
                        <p className="mt-2 text-sm text-red-500" key={error}>
                          {error}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                </div>
                <div>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    aria-describedby="confirm-password-error"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={isPending}
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
              </div>
              <div>
                <div id="form-error" aria-live="polite" aria-atomic="true">
                  {state.message && (
                    <p className="text-sm text-red-500">{state.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? 'Signing up...' : 'Sign up'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
