import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import HeroSection from "@/components/hero-section"
import { loadNewArrivals } from "@/services/book-service"

// Re-fetch book lists at most once an hour instead of freezing them at build time.
export const revalidate = 3600

export default async function NewArrivalsPage() {
  // Get new arrivals from API
  const result = await loadNewArrivals()
  const newArrivals = result.books

  return (
    <main>
      <Navigation />
      <HeroSection />

      <div className="book-list-container">
        <h1 className="book-list-title">New Arrivals</h1>

        <div className="section">
          {result.error && (
            <p className="text-center py-8 text-gray-500">Books could not be loaded right now. Please try again later.</p>
          )}
          <div className="book-grid-full">
            {newArrivals.map((book) => (
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
