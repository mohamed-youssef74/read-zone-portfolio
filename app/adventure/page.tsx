import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import HeroSection from "@/components/hero-section"
import { getAdventureBooks } from "@/services/book-service"

// Re-fetch book lists at most once an hour instead of freezing them at build time.
export const revalidate = 3600

export default async function AdventurePage() {
  // Get adventure books from API
  const adventureBooks = await getAdventureBooks().catch(() => [])

  return (
    <main>
      <Navigation />
      <HeroSection />

      <div className="book-list-container">
        <h1 className="book-list-title">Adventure Books</h1>

        <div className="section">
          <div className="book-grid-full">
            {adventureBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                externalId={book.externalId}
                olid={book.olid}
                title={book.title}
                coverImage={book.coverImageUrl}
                rating={4.0}
                authors={book.authors}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
