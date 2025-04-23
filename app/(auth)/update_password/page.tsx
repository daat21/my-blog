import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updatePassword } from '../action'
import { ShineBorder } from '@/components/magicui/shine-border'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
  return (
    <Card className="relative w-full max-w-[350px] overflow-hidden">
      <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updatePassword}>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                </div>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                />
              </div>

              <Button variant="outline" type="submit">
                Reset Password
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
