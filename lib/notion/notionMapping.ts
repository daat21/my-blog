// https://scalloped-bass-e94.notion.site/My-Blog-28ea7ccf9ad98008adc7ee903f82edac?source=copy_link

export const SLUG_TO_PAGE_ID: Record<string, string> = {
  'hello-notion': '28ea7ccf9ad98008adc7ee903f82edac',
}

export const ALL_SLUGS = Object.keys(SLUG_TO_PAGE_ID)

export function getPageIdBySlug(slug: string): string | undefined {
  return SLUG_TO_PAGE_ID[slug]
}
