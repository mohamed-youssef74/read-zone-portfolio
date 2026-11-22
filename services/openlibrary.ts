// Open Library (https://openlibrary.org) as a fallback source for book lists, search and details.
// Real data only. Used when the main books API fails or returns nothing.
import type { Book } from "./book-service"

const OL = "https://openlibrary.org"
const REVALIDATE = { next: { revalidate: 60 } } as RequestInit

export interface OLBook extends Book {
  olid: string
  firstPublishYear?: number
}

export function coverUrl(coverId?: number | null, size: "M" | "L" = "M") {
  return coverId && coverId > 0 ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : undefined
}

function workId(key: string) {
  // "/works/OL45804W" -> "OL45804W"
  const m = key.match(/OL\d+W/)
  return m ? m[0] : ""
}

function toBook(x: { olid: string; title: string; authors: string[]; cover?: number | null; year?: number; subjects?: string[] }): OLBook {
  return {
    id: Number(x.olid.replace(/\D/g, "")),
    externalId: 0,
    olid: x.olid,
    title: x.title,
    authors: x.authors.map((name, i) => ({ id: i, name })),
    subjects: x.subjects || [],
    formats: {},
    coverImageUrl: coverUrl(x.cover),
    firstPublishYear: x.year,
  }
}

async function getJson(url: string) {
  // Retry transient provider failures once; never substitute unrelated books.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { ...REVALIDATE, signal: AbortSignal.timeout(8000) })
      if (!res.ok) {
        if (attempt === 0 && res.status >= 500) continue
        throw new Error(`Open Library error: ${res.status}`)
      }
      return await res.json()
    } catch (error) {
      if (attempt === 1) throw error
    }
  }
  throw new Error("Open Library request failed")
}

function fromSearch(docs: any[]): OLBook[] {
  return docs
    .filter((d) => d.key && workId(d.key) && d.title)
    .map((d) =>
      toBook({ olid: workId(d.key), title: d.title, authors: d.author_name || [], cover: d.cover_i, year: d.first_publish_year }),
    )
}

export async function olPopular(limit = 20): Promise<OLBook[]> {
  const d = await getJson(`${OL}/trending/daily.json?limit=${limit}`)
  return (d.works || [])
    .filter((w: any) => workId(w.key || ""))
    .map((w: any) =>
      toBook({ olid: workId(w.key), title: w.title, authors: w.author_name || [], cover: w.cover_i, year: w.first_publish_year }),
    )
}

export async function olSubject(slug: string, limit = 20): Promise<OLBook[]> {
  const d = await getJson(`${OL}/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`)
  return (d.works || [])
    .filter((w: any) => workId(w.key || ""))
    .map((w: any) =>
      toBook({
        olid: workId(w.key),
        title: w.title,
        authors: (w.authors || []).map((a: any) => a.name),
        cover: w.cover_id,
        year: w.first_publish_year,
        subjects: w.subject || [],
      }),
    )
}

export async function olNew(limit = 20): Promise<OLBook[]> {
  const year = new Date().getFullYear()
  // Only works with covers and an author, so the grid is not full of blanks.
  const q = `first_publish_year:[${year - 1} TO ${year}] AND has_fulltext:true AND cover_i:[1 TO *] AND language:eng AND author_name:*`
  const d = await getJson(
    `${OL}/search.json?q=${encodeURIComponent(q)}&sort=new&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year`,
  )
  // Skip very long titles so cards stay readable.
  return fromSearch((d.docs || []).filter((x: any) => x.title && x.title.length <= 60 && x.author_name?.length))
}

export async function olSearch(query: string, limit = 24): Promise<OLBook[]> {
  const d = await getJson(
    `${OL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year`,
  )
  return fromSearch(d.docs || [])
}

export interface OLWork {
  olid: string
  title: string
  description: string
  subjects: string[]
  cover?: string
  authors: string[]
  firstPublishDate?: string
  url: string
}

export async function olWork(olid: string): Promise<OLWork | null> {
  if (!/^OL\d+W$/.test(olid)) return null
  const res = await fetch(`${OL}/works/${olid}.json`, REVALIDATE)
  if (!res.ok) return null
  const w = await res.json()
  const description = typeof w.description === "string" ? w.description : w.description?.value || ""
  const authorKeys: string[] = (w.authors || []).map((a: any) => a.author?.key).filter(Boolean)
  const authors = (
    await Promise.all(
      authorKeys.slice(0, 5).map(async (k) => {
        try {
          const a = await getJson(`${OL}${k}.json`)
          return a.name as string
        } catch {
          return ""
        }
      }),
    )
  ).filter(Boolean)
  const cover = (w.covers || []).find((c: number) => c > 0)
  return {
    olid,
    title: w.title,
    description,
    subjects: (w.subjects || []).slice(0, 12),
    cover: coverUrl(cover, "L"),
    authors,
    firstPublishDate: w.first_publish_date,
    url: `${OL}/works/${olid}`,
  }
}
