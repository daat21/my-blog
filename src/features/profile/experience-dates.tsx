import { formatExperienceDate } from './experience-date'

interface ExperienceDatesProps {
  start: string
  end?: string
}

export function ExperienceDates({ start, end }: ExperienceDatesProps) {
  return (
    <>
      <time dateTime={start}>{formatExperienceDate(start)}</time>
      {' – '}
      {end === undefined ? (
        formatExperienceDate(end)
      ) : (
        <time dateTime={end}>{formatExperienceDate(end)}</time>
      )}
    </>
  )
}
