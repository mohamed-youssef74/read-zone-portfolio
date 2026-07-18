import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import HeroSection from "@/components/hero-section"
import BookCard from "@/components/book-card"
import { getPopularBooks } from "@/services/book-service"

export default async function BusinessPage() {
  // Use popular books as business books for now
  const businessBooks = await getPopularBooks()

  return (
    <main>
      <Navigation />
      <HeroSection />

      <div className="book-list-container">
        <h1 className="book-list-title">Business</h1>

        <div className="section">
          <div className="book-grid-full">
            {businessBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                coverImage={book.coverImageUrl || "/placeholder.svg"}
                rating={4.5}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
