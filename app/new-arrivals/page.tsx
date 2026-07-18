import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import HeroSection from "@/components/hero-section"
import { getNewArrivals } from "@/services/book-service"

export default async function NewArrivalsPage() {
  // Get new arrivals from API
  const newArrivals = await getNewArrivals().catch(() => [])

  return (
    <main>
      <Navigation />
      <HeroSection />

      <div className="book-list-container">
        <h1 className="book-list-title">New Arrivals</h1>

        <div className="section">
          <div className="book-grid-full">
            {newArrivals.map((book) => (
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
