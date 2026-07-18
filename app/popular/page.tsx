import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import HeroSection from "@/components/hero-section"
import { getPopularBooks } from "@/services/book-service"

export default async function PopularPage() {
  // Get popular books from API
  const popularBooks = await getPopularBooks().catch(() => [])

  return (
    <main>
      <Navigation />
      <HeroSection />

      <div className="book-list-container">
        <h1 className="book-list-title">Popular now</h1>

        <div className="section">
          <div className="book-grid-full">
            {popularBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                externalId={book.externalId}
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
