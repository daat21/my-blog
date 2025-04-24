export const formatDate = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    // Format time as fixed format (HH:MM AM/PM)
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    const timeString = `${hour12}:${minutes} ${ampm}`

    // If within 5 minutes, show "Just now"
    if (diffMinutes < 5) {
      return 'Just now'
    }

    // If within 1 hour, show "X minutes ago"
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    }

    // If within 12 hours, show "X hours ago"
    if (diffHours < 12) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    }

    // Check if it's today
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {
      return `Today at ${timeString}`
    }

    // Check if it's yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()

    if (isYesterday) {
      return `Yesterday at ${timeString}`
    }

    // For other cases, use a fixed date format that will be consistent
    // between server and client
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const year = date.getFullYear()
    const month = months[date.getMonth()]
    const day = date.getDate()

    return `${month} ${day}, ${year}, ${timeString}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return isoDateString
  }
}

export const formatDateOnly = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString)
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const year = date.getFullYear()
    const month = months[date.getMonth()]
    const day = date.getDate()

    return `${month} ${day}, ${year}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return isoDateString
  }
}
