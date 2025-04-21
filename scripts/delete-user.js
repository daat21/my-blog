// scripts/delete-user.js
require('dotenv').config({ path: '.env.local' }) // 加载 .env.local 文件中的环境变量
const { createClient } = require('@supabase/supabase-js')

// 从命令行参数获取要删除的 User ID
const userIdToDelete = process.argv[2] // 第三个参数 (node script.js userId)

if (!userIdToDelete) {
  console.error('Error: Please provide the User ID as a command-line argument.')
  process.exit(1) // 退出脚本
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

// 创建 Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 定义并执行删除函数
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

// 执行函数
deleteUser()
