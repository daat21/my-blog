/** Whether a link leaves the site: an absolute `http(s):` or protocol-relative URL. */
export function isExternalHref(href: string): boolean {
  return /^(?:https?:)?\/\//i.test(href)
}
