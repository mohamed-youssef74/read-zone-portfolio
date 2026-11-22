import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import HeroSection from "@/components/hero-section"
import { getFictionBooks } from "@/services/book-service"

// Re-fetch book lists at most once an hour instead of freezing them at build time.
export const revalidate = 3600

export default async function NovelPage() {
  const novelBooks = await getFictionBooks()

  return (
    <main>
      <Navigation />
      <HeroSection />

      <div className="categories">
        <Link href="/novel" className="category active">
          Novel
        </Link>
        <Link href="/science" className="category">
          Science
        </Link>
        <Link href="/romance" className="category">
          Romance
        </Link>
        <Link href="/crime" className="category">
          Crime
        </Link>
        <Link href="/education" className="category">
          Education
        </Link>
        <Link href="/psychology" className="category">
          Psychology
        </Link>
      </div>

      <div className="book-list-container">
        <h1 className="book-list-title">Novel</h1>

        <div className="section">
          <div className="book-grid-full">
            {novelBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                coverImage={book.coverImage}
                rating={book.rating}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
