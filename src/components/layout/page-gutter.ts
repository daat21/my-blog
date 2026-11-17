/**
 * Padding around a page's content, matching the article mockup: 16px on
 * phones growing to 72px on desktops. The page's SiteFooter, rendered at the
 * end of its column, provides the space below the content.
 */
export const PAGE_GUTTER = 'px-4 pt-8 pb-10 md:px-10 md:pt-10 lg:px-14 xl:px-18'

/** Stretch a page and its column so short-page footers can use auto space. */
export const PAGE_FRAME = `${PAGE_GUTTER} flex flex-1 flex-col`
export const PAGE_COLUMN = 'flex w-full flex-1 flex-col'

/** The reading column: about 70 characters of body text. */
export const READING_COLUMN = 'mx-auto max-w-172.5'

/** A column for photographs: 1100px at most, wider than the reading column. */
export const WIDE_COLUMN = 'mx-auto max-w-275'
