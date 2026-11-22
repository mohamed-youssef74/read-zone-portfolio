# Read Zone

Book discovery website: browse categories, search a live catalog, and open book detail pages.

Live demo: https://read-zone-portfolio.vercel.app/

## Working features

- Home page with Popular (daily trending), Fiction and New Arrivals sections
- Category pages: fiction, fantasy, mystery, crime, romance, science, business, adventure, psychology, education and novels
- Live book search
- Book detail pages with real catalog data

## Built but dependent on the backend API

These screens and flows are implemented, but they rely on the external books backend and are not available for every book:

- Signup / login flows
- Personal library, favourites, bookmarks, notes and reading history
- Reviews
- Audiobooks section with its own categories and search

## Data sources

Book lists, search and details primarily come from a main books API. When that API fails or returns nothing for a list or search, the app tries Open Library (https://openlibrary.org) as a best-effort fallback, with an 8-second timeout, one retry, and 60-second cache revalidation. Fallback book pages use Open Library data and look different from full backend book pages; not every book has a fallback version, and the fallback does not guarantee uninterrupted data.

## Tech stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS, Radix UI components, lucide-react icons
- REST APIs
- Deployed on Vercel

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000

## Notes and limitations

- Both book data sources are external services; availability depends on them.
- Books shown through the Open Library fallback do not support reading, favourites, reviews or bookmarks. This is shown on the page when it applies.
