import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountTab } from '@/components/profiles/AccountTab'
import { PasswordTab } from '@/components/profiles/PasswordTab'

export default async function UserPage() {
  // const supabase = await createClient()
  // const { data: profiles, error } = await supabase.from('profiles').select('*')

  // if (error) {
  //   console.error(error)
  // } else {
  //   console.log(profiles)
  // }

  return (
    // <div className="flex items-center justify-center">
    <Tabs defaultValue="account" className="mx-auto mt-10 w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <AccountTab />
      <PasswordTab />
    </Tabs>
  )
}
