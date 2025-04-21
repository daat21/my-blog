import { Suspense } from 'react'
import DesktopNavigation from './desktop-nav'
import MobileNavigation from './mobile-nav'
import { createClient } from '@/lib/supabase/server'
const navItems = [
  {
    name: 'About',
    link: '/',
  },
  {
    name: 'Blogs',
    link: '/blogs',
  },
  {
    name: 'Projects',
    link: '/projects',
  },
  {
    name: 'Contact',
    link: '/contact',
  },
]

export default async function NavigationBar() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  let avatarUrl = null
  let username = null

  if (user && !userError) {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url, username')
      .eq('id', user?.id)
      .single()

    if (!error && data) {
      avatarUrl = data.avatar_url
      username = data.username
    }
  }
  // console.log(user)

  // let profileData = null
  // if (user && !userError) {
  //   const { data, error } = await supabase
  //     .from('profiles')
  //     .select('*')
  //     .eq('id', user.id)
  //     .single()

  //   if (error) {
  //     console.error('Error fetching profile data:', error)
  //   } else {
  //     profileData = data
  //   }
  // }

  return (
    <nav>
      <Suspense fallback={<div>Loading desktop navigation...</div>}>
        <DesktopNavigation
          navItems={navItems}
          isAuthenticated={Boolean(user) && !userError}
          avatarUrl={avatarUrl}
          username={username}
        />
      </Suspense>

      <Suspense fallback={<div>Loading mobile navigation...</div>}>
        <MobileNavigation navItems={navItems} />
      </Suspense>
    </nav>
  )
}
