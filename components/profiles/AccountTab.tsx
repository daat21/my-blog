import { TabsContent } from '@radix-ui/react-tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Label } from '@radix-ui/react-label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { AvatarUpload } from './AvatarUpload'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { uploadAvatar } from './action'

export async function AccountTab() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) {
    redirect('/login')
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()
  if (error) {
    console.error(error)
  }

  return (
    <TabsContent value="account">
      <form action={uploadAvatar}>
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <AvatarUpload
              src={profiles?.avatar_url}
              fallback={profiles?.username}
            />
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                defaultValue={'@' + profiles?.username}
                disabled
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Save changes</Button>
          </CardFooter>
        </Card>
      </form>
    </TabsContent>
  )
}
