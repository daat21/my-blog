import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui/card'
import { ShineBorder } from '@/components/magicui/shine-border'
import { Button } from '../ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Github } from 'lucide-react'

export function EmailConfirmCard() {
  return (
    <Card className="bg-background relative w-full max-w-[350px] overflow-hidden">
      <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Confirm your email</CardTitle>
        <CardDescription>
          We have sent a confirmation email to you for email verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8">
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <Button variant="outline" className="w-fit" type="button">
          Resend confirmation email
        </Button>
      </CardContent>
    </Card>
  )
}
