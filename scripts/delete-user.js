require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const userIdToDelete = process.argv[2]

if (!userIdToDelete) {
  console.error('Error: Please provide the User ID as a command-line argument.')
  process.exit(1)
}

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    'Error: Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your .env.local file.'
  )
  process.exit(1)
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteUser() {
  console.log(`Attempting to delete user: ${userIdToDelete}`)
  const { data, error } =
    await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)

  if (error) {
    console.error(`Error deleting user ${userIdToDelete}:`, error.message)
  } else {
    console.log(`Successfully deleted user ${userIdToDelete}. Response:`, data)
  }
}

deleteUser()
