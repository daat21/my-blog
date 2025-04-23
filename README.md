## 1. Overview

`my-blog` is a web application built with Next.js 15 and the App Router. It serves as a personal blog platform, featuring blog posts, user authentication, message board, and back-end manage interface. The project utilises modern web development practices, including TypeScript, Tailwind CSS for styling, and Supabase for backend services. 

## 2. Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/)
- **Component Libraries:**
    - `motion`: Animation library.
    - `magicui`: UI components.
    - `lucide-react`, `@heroicons/react`, `@tabler/icons-react`: Icon libraries.
    - `next-themes`: Dark mode / theme management.
    - `class-variance-authority` & `clsx`: For managing component variants and conditional classes.
    - `@react-three/fiber`, `three`, `cobe`: 3D/WebGL elements.
- **Markdown:** `react-markdown`, `rehype-highlight`, `remark-gfm`, `highlight.js`: For rendering and styling Markdown content (likely blog posts).
- **Backend/Authentication:**
    - `@supabase/ssr`, `@supabase/supabase-js`: Supabase integration for backend-as-a-service (database, auth).
- **Linting/Formatting:** ESLint, Prettier (`prettier-plugin-tailwindcss`)
- **Analytics:** Vercel Analytics, Vercel Speed Insights
- **Deployment:** Vercel

## 3. Key Features

- **Blog Platform:** Displaying blog posts, likely fetched from a backend (Supabase) and rendered from Markdown.
- **User permission classification：** (for content access), implemented using PostgreSQL ENUM Types.
    - Users are assigned 'normal', 'plus', or 'Admin' levels, allowing them to respectively access different tiers of database content (e.g., articles, comments, messages).
- **User Authentication:** Login/signup functionality (`app/(auth)/`, `components/auth/`, Supabase dependencies).
- **Theming:** Light/dark mode support (`next-themes`, `ModeToggle.tsx`).
- **Responsive Design:** Built with Tailwind CSS, implying responsiveness.
- **Optimised Images:** Uses Next.js Image component, configured for Supabase remote patterns (`next.config.ts`).
- **Analytics:** Integrated Vercel Analytics and Speed Insights (`app/layout.tsx`).
- **Potential 3D/Interactive Elements:** Inclusion of `three`, `@react-three/fiber`, `cobe` suggests possible interactive visuals.

## 4. Project Structure

```
my-blog/
├── app/                     # Main application code (App Router)
│   ├── (auth)/              # Authentication related pages/routes
│   ├── (home)/              # Main site pages/routes
│   ├── globals.css          # Global CSS styles
│   └── layout.tsx           # Root application layout
├── components/              # Shared UI components
│   ├── auth/                # Authentication components
│   ├── blogs/               # Blog-specific components
│   ├── contact/             # Contact form components
│   ├── home/                # Components specific to home pages
│   ├── pages/               # General page-level components
│   ├── profiles/            # User profile components
│   ├── project/             # Project display components
│   ├── ui/                  # Base UI components (Shadcn UI)
├── lib/                     # Utility functions and helpers
│   ├── supabase/            # Supabase client/utility setup
│   └── utils.ts             # General utilities
├── types/                   # Define types
├── public/                  # Static assets (images, fonts, etc.)
├── scripts/                 # Build scripts
├── middleware.ts            # Next.js middleware
├── prettier.config.js       # Prettier configuration

```

- **`app/`**: Organises routes using Next.js App Router conventions. Route groups (`(auth)`, `(home)`) are used to structure sections without affecting the URL path.
- **`components/`**: Contains reusable React components, categorized by feature (`auth`, `blogs`, `home`, etc.) or type (`ui`).
- **`lib/`**: Includes helper functions, utility modules like date formatting, and Supabase client setup.

## 5. Components

- **Organisation:** Components are grouped by feature (`blogs`, `auth`, `home`) or type (`ui`, `magicui`) within the `components/` directory.
- **Conventions:**
    - Functional Components with TypeScript (`.tsx`).
    - PascalCase naming (e.g., `BlogCard.tsx`).
    - Named exports are common.
    - Props are clearly typed using TypeScript interfaces or types.

## 6. Styling

- **Tailwind CSS:** The primary styling method, using utility classes. Configured in `tailwind.config.js` and `postcss.config.mjs`. Tailwind v4 is used.
- **Global Styles:** Base styles and Tailwind directives are in `app/globals.css`.
- **Shadcn UI:** Provides pre-built, customisable components styled with Tailwind.
- **Typography:** `@tailwindcss/typography` plugin likely used for styling Markdown content.
- **Animations:** Includes custom keyframes (`caret-blink`) in `tailwind.config.js` and uses `motion` library.

## 7. Configuration

- `.prettierrc`
    
    ```json
    {
      "semi": false,
      "singleQuote": true,
      "tabWidth": 2,
      "trailingComma": "es5",
      "printWidth": 80,
      "bracketSpacing": true,
      "arrowParens": "avoid",
      "jsxSingleQuote": false,
      "jsxBracketSameLine": false,
      "plugins": ["prettier-plugin-tailwindcss"]
    }
    ```
    
- **`tailwind.config.js`:**
    - Extends the default theme with custom keyframes and animations (`caret-blink`).
- **`middleware.ts`:** Handles request middleware (specific logic needs inspection).
- **Environment Variables:** Supabase keys and other secrets should be managed via environment variables (e.g., in `.env.local`). `dotenv` package is used for local script running.

## 8. Running the Project

Standard Next.js scripts are available in `package.json`:

- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Start Production Server:** `npm run start`
- **Linting:** `npm run lint`

Ensure necessary environment variables (e.g., Supabase URL and keys) are set up in a `.env.local` file.

## 9. Deployment

Deployment would connect the Git repository to Vercel.
