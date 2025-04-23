import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShineBorder } from '@/components/magicui/shine-border'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Confirm() {
  return (
    <Card className="relative w-full max-w-[350px] overflow-hidden">
      <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
      <CardHeader className="pb-0 text-center">
        <CardTitle className="text-xl">Confirm your email</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p>
          I have sent an email to you for verification. Follow the link provided
          to finalize the process. If you do not see the verification email in
          your main inbox, check your spam folder.
        </p>
        <Button variant="outline" asChild>
          <Link href="/login">Back to login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
