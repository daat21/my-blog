import { ShineBorder } from '@/components/magicui/shine-border'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/app/(auth)/action'

export default async function ForgetPasswordPage() {
  return (
    <Card className="relative w-full max-w-[350px] overflow-hidden">
      <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={resetPassword}>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Input type="email" placeholder="Email" name="email" required />
              <Button variant="outline" type="submit">
                Send Reset Link
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
