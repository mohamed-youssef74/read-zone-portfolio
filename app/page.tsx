import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import HeroSection from "@/components/hero-section"
import SearchForm from "@/components/search-form"
import { loadNewBooks, loadPopularBooks, loadFictionBooks } from "@/services/book-service"

// Re-fetch book lists at most once an hour instead of freezing them at build time.
export const revalidate = 3600

export default async function Home() {
  // Fetch data from the API with proper error handling
  let popularBooks: any[] = []
  let fictionBooks: any[] = []
  let newArrivals: any[] = []
  let popularError = false
  let fictionError = false

  const [popularResult, fictionResult, newResult] = await Promise.all([
    loadPopularBooks(),
    loadFictionBooks(),
    loadNewBooks(),
  ])
  popularBooks = popularResult.books
  popularError = popularResult.error
  fictionBooks = fictionResult.books
  fictionError = fictionResult.error
  newArrivals = newResult.books

  return (
    <main>
      <Navigation />
      <HeroSection />

      <SearchForm />

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Link href="/popular">Popular now</Link>
          </h2>
          <Link href="/popular" className="see-all">
            See all ›
          </Link>
        </div>
        <div className="book-grid">
          {popularBooks.length > 0 ? (
            popularBooks
              .slice(0, 7)
              .map((book) => (
                <BookCard
                  key={book.id || book.externalId}
                  id={book.id}
                  externalId={book.externalId}
                olid={book.olid}
                  title={book.title || "Unknown Title"}
                  coverImage={book.coverImageUrl || "/placeholder.svg?height=200&width=150"}
                  rating={4.0}
                  authors={book.authors || []}
                />
              ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">{popularError ? "Books could not be loaded right now. Please try again later." : "No popular books available at the moment"}</div>
          )}
        </div>
      </section>

      <div className="categories">
        <Link href="/fiction" className="category active">
          Fiction
        </Link>
        <Link href="/romance" className="category">
          Romance
        </Link>
        <Link href="/science" className="category">
          Science
        </Link>
        <Link href="/history" className="category">
          History
        </Link>
        <Link href="/adventure" className="category">
          Adventure
        </Link>
        <Link href="/mystery" className="category">
          Mystery
        </Link>
        <Link href="/fantasy" className="category">
          Fantasy
        </Link>
        <Link href="/philosophy" className="category">
          Philosophy
        </Link>
      </div>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Fiction</h2>
          <Link href="/fiction" className="see-all">
            See all ›
          </Link>
        </div>
        <div className="book-grid">
          {fictionBooks.length > 0 ? (
            fictionBooks
              .slice(0, 7)
              .map((book) => (
                <BookCard
                  key={book.id || book.externalId}
                  id={book.id}
                  externalId={book.externalId}
                olid={book.olid}
                  title={book.title || "Unknown Title"}
                  coverImage={book.coverImageUrl || "/placeholder.svg?height=200&width=150"}
                  rating={4.0}
                  authors={book.authors || []}
                />
              ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">{fictionError ? "Books could not be loaded right now. Please try again later." : "No fiction books available at the moment"}</div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">New Arrivals</h2>
          <Link href="/new-arrivals" className="see-all">
            See all ›
          </Link>
        </div>
        <div className="book-grid">
          {newArrivals.length > 0 ? (
            newArrivals
              .slice(0, 7)
              .map((book) => (
                <BookCard
                  key={book.id || book.externalId}
                  id={book.id}
                  externalId={book.externalId}
                olid={book.olid}
                  title={book.title || "Unknown Title"}
                  coverImage={book.coverImageUrl || "/placeholder.svg?height=200&width=150"}
                  rating={4.0}
                  authors={book.authors || []}
                />
              ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">No new arrivals available at the moment</div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
