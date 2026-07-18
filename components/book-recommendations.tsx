"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { getBookRecommendations, type Book } from "@/services/book-service"

interface BookRecommendationsProps {
  currentBookTitle: string
  currentBookId: number
}

export default function BookRecommendations({ currentBookTitle, currentBookId }: BookRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentBookTitle) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log(`Fetching recommendations for: ${currentBookTitle}`)
        const recommendedBooks = await getBookRecommendations(currentBookTitle)

        // Filter out the current book from recommendations
        const filteredRecommendations = recommendedBooks.filter(
          (book) => book.id !== currentBookId && book.externalId !== currentBookId,
        )

        console.log(`Found ${filteredRecommendations.length} recommendations`)
        setRecommendations(filteredRecommendations.slice(0, 6)) // Limit to 6 books
      } catch (error) {
        console.error("Error fetching recommendations:", error)
        setError("Failed to load recommendations")
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [currentBookTitle, currentBookId])

  if (loading) {
    return (
      <section className="section">
        <div className="section-title">
          <span>📚</span> Recommended for you
        </div>
        <div className="recommendations-loading">
          <div className="loading">Loading recommendations...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="section-title">
          <span>📚</span> Recommended for you
        </div>
        <div className="recommendations-error">
          <p>Unable to load recommendations at this time.</p>
        </div>
      </section>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <section className="section">
      <div className="section-title">
        <span>📚</span> Recommended for you
      </div>
      <div className="recommendations-grid">
        {recommendations.map((book) => (
          <Link key={book.id} href={`/review/${book.id}`} className="recommendation-card">
            <div className="recommendation-image">
              <Image
                src={book.coverImageUrl || "/placeholder.svg"}
                alt={book.title}
                width={120}
                height={180}
                className="book-cover-small"
              />
            </div>
            <div className="recommendation-info">
              <h4 className="recommendation-title">{book.title}</h4>
              {book.authors && book.authors.length > 0 && (
                <p className="recommendation-author">{book.authors.map((author) => author.name).join(", ")}</p>
              )}
              {book.subjects && book.subjects.length > 0 && (
                <div className="recommendation-subjects">
                  {book.subjects.slice(0, 2).map((subject, index) => (
                    <span key={index} className="subject-tag">
                      {subject}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
