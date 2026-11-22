"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import SearchForm from "@/components/search-form"
import { searchBooks, type Book } from "@/services/book-service"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (query) {
      setIsLoading(true)
      let cancelled = false
      searchBooks(query).then((searchResults) => {
        if (!cancelled) {
          setResults(searchResults)
          setIsLoading(false)
        }
      })
      return () => {
        cancelled = true
      }
    } else {
      setResults([])
      setIsLoading(false)
    }
  }, [query])

  return (
    <main>
      <Navigation />

      <SearchForm />

      <div className="book-list-container">
        <h1 className="book-list-title">{query ? `Search results for "${query}"` : "Search for books"}</h1>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : results.length > 0 ? (
          <div className="section">
            <div className="book-grid-full">
              {results.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  externalId={book.externalId}
                  olid={(book as any).olid}
                  title={book.title}
                  coverImage={book.coverImageUrl}
                  authors={book.authors}
                  rating={4.0}
                />
              ))}
            </div>
          </div>
        ) : query ? (
          <div className="no-results">
            <p>No books found matching "{query}"</p>
            <p>Try searching for a different book title or author name.</p>
          </div>
        ) : (
          <div className="search-instructions">
            <p>Enter a book title or author name in the search box above.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
