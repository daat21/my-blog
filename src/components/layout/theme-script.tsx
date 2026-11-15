import { THEME_INIT_SCRIPT } from './theme'

/** Sets the theme before first paint. Render inside <head>. */
export function ThemeScript() {
  return (
    <script
      // eslint-disable-next-line react/no-danger -- The no-flash theme script must run inline before the page paints; its content is a static constant.
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  )
}
