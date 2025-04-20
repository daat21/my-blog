export const formatDate = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    // Format the time part (H:MM AM/PM)
    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }
    const timeString = date.toLocaleTimeString(undefined, timeFormat)

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

    // For other cases, show the full date and time
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }

    return date.toLocaleString(undefined, options)
  } catch (error) {
    console.error('Error formatting date:', error)
    return isoDateString
  }
}

export const formatDateOnly = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
    return date.toLocaleDateString(undefined, options)
  } catch (error) {
    console.error('Error formatting date:', error)
    return isoDateString
  }
}
