import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { olWork } from "@/services/openlibrary"

export default async function OpenLibraryBookPage({ params }: { params: Promise<{ olid: string }> }) {
  const { olid } = await params
  const work = await olWork(olid).catch(() => null)

  return (
    <main>
      <Navigation />
      <div className="book-list-container">
        {!work ? (
          <div className="no-results">
            <p>This book could not be loaded right now.</p>
            <Link href="/">Back to home</Link>
          </div>
        ) : (
          <div className="section">
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{work.title}</h1>
            <p style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "rgba(128,128,128,0.15)" }}>
              Reviews, favorites, bookmarks and reading are not available for this book. Book details come from Open Library while
              the main Read Zone service is unavailable.
            </p>
            {work.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={work.cover} alt={work.title} style={{ maxWidth: 220, borderRadius: 8, marginBottom: 16 }} />
            )}
            {work.authors.length > 0 && <p>By {work.authors.join(", ")}</p>}
            {work.firstPublishDate && <p>First published: {work.firstPublishDate}</p>}
            {work.description && <p style={{ marginTop: 16, whiteSpace: "pre-line" }}>{work.description}</p>}
            {work.subjects.length > 0 && <p style={{ marginTop: 16 }}>Topics: {work.subjects.join(", ")}</p>}
            <p style={{ marginTop: 16 }}>
              <a href={work.url} target="_blank" rel="noopener noreferrer">
                View on Open Library
              </a>
            </p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
