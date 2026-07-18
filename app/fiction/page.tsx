import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import HeroSection from "@/components/hero-section"
import { getFictionBooks } from "@/services/book-service"

export default async function FictionPage() {
  // Get fiction books from API
  const fictionBooks = await getFictionBooks().catch(() => [])

  return (
    <main>
      <Navigation />
      <HeroSection />

      <div className="book-list-container">
        <h1 className="book-list-title">Fiction Books</h1>

        <div className="section">
          <div className="book-grid-full">
            {fictionBooks.map((book) => (
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
