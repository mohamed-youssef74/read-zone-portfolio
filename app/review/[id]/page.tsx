"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import HeroSection from "@/components/hero-section"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import {
  getBookById,
  addToRecentlyPlayed,
  toggleFavorite,
  toggleBookmark,
  addToDownloads,
  isFavorite,
  isBookmarked,
  isDownloaded,
  addCollectionChangeListener,
} from "@/services/book-service"
import {
  createReview,
  getBookReviews,
  deleteReview,
  calculateReviewStats,
  formatReviewDate,
  canUserReview,
  getCurrentUser,
  getApiStatus,
  syncPendingReviews,
  type Review,
} from "@/services/review-service"
import BookRecommendations from "@/components/book-recommendations"

export default function BookReview({ params }: { params: { id: string } }) {
  const { id } = params
  const bookId = Number.parseInt(id)
  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  // State for action buttons
  const [isFav, setIsFav] = useState(false)
  const [isBookmark, setIsBookmark] = useState(false)
  const [isDownload, setIsDownload] = useState(false)

  // State for reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(0)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [visibleReviews, setVisibleReviews] = useState(3)
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    distribution: [],
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [apiStatus, setApiStatus] = useState({ isOnline: false, message: "Checking connection..." })

  // State for modals
  const [showReaderModal, setShowReaderModal] = useState(false)

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      const status = await getApiStatus()
      setApiStatus(status)

      // Try to sync pending reviews if API is online
      if (status.isOnline && isLoggedIn) {
        try {
          await syncPendingReviews()
        } catch (error) {
          console.error("Error syncing pending reviews:", error)
        }
      }
    }

    checkApiStatus()
  }, [isLoggedIn])

  // Fetch book data
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookData = await getBookById(bookId)
        if (bookData) {
          setBook(bookData)

          // Add to recently played when viewing book details
          if (isLoggedIn) {
            await addToRecentlyPlayed(bookData.externalId)
          }

          // Set initial states for user actions
          if (isLoggedIn) {
            setIsFav(await isFavorite(bookData.externalId))
            setIsBookmark(await isBookmarked(bookData.externalId))
            setIsDownload(await isDownloaded(bookData.externalId))
          }
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching book:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchBook()
  }, [bookId, router, isLoggedIn])

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!book) return

      try {
        setReviewsLoading(true)

        console.log(`Fetching reviews for book external ID: ${book.externalId}`)
        const bookReviews = await getBookReviews(book.externalId)

        console.log(`Received ${bookReviews.length} reviews`)
        setReviews(bookReviews)
        setReviewStats(calculateReviewStats(bookReviews))
      } catch (error) {
        console.error("Error fetching reviews:", error)
        setReviews([])
        setReviewStats(calculateReviewStats([]))
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [book])

  // Update state when collections change
  useEffect(() => {
    if (!book || !isLoggedIn) return

    const updateState = async () => {
      setIsFav(await isFavorite(book.externalId))
      setIsBookmark(await isBookmarked(book.externalId))
      setIsDownload(await isDownloaded(book.externalId))
    }

    const removeListener = addCollectionChangeListener(updateState)
    return () => removeListener()
  }, [book, isLoggedIn])

  // Handle action buttons
  const handleFavorite = async () => {
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }
    try {
      const newStatus = await toggleFavorite(book.externalId)
      setIsFav(newStatus)
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const handleBookmark = async () => {
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }
    try {
      const newStatus = await toggleBookmark(book.externalId)
      setIsBookmark(newStatus)
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }

  const handleDownload = async () => {
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }
    try {
      await addToDownloads(book.externalId)
      setIsDownload(true)
      alert(`تم بدء تنزيل "${book.title}"`)
    } catch (error) {
      console.error("Error adding to downloads:", error)
    }
  }

  // Handle Read Now button click
  const handleReadNow = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }
    setShowReaderModal(true)
  }

  // Handle Post review button click
  const handlePostReview = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    if (!reviewText.trim() || reviewRating === 0) {
      alert("Please provide both rating and feedback")
      return
    }

    try {
      setSubmittingReview(true)

      const reviewData = {
        bookExternalId: book.externalId,
        rating: reviewRating,
        feedback: reviewText.trim(),
      }

      console.log("Submitting review:", reviewData)
      const newReview = await createReview(reviewData)

      // Always use current user data from auth context to ensure proper display
      const currentUser = getCurrentUser()
      const authUser = user // from useAuth hook

      const reviewWithUserInfo: Review = {
        ...newReview,
        user: {
          id: currentUser?.id || authUser?.id || 0,
          username: currentUser?.username || authUser?.username || "Anonymous",
          profileImageUrl: currentUser?.profileImageUrl || authUser?.avatar || authUser?.profileImageUrl || undefined,
        },
      }

      // Add the new review to the beginning of the list
      const updatedReviews = [reviewWithUserInfo, ...reviews]

      setReviews(updatedReviews)
      setReviewStats(calculateReviewStats(updatedReviews))

      // Reset form
      setReviewText("")
      setReviewRating(0)

      // Show success message
      alert("تم حفظ مراجعتك!")
    } catch (error) {
      console.error("Error posting review:", error)
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع"

      if (errorMessage.includes("Authentication")) {
        alert("يرجى تسجيل الدخول مرة أخرى")
        router.push("/auth/login")
      } else {
        alert(`حدث خطأ: ${errorMessage}`)
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  // Handle review deletion
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المراجعة؟")) {
      return
    }

    try {
      await deleteReview(reviewId)

      const updatedReviews = reviews.filter((review) => review.id !== reviewId)
      setReviews(updatedReviews)
      setReviewStats(calculateReviewStats(updatedReviews))

      alert("تم حذف المراجعة بنجاح!")
    } catch (error) {
      console.error("Error deleting review:", error)
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع"
      alert(`حدث خطأ أثناء حذف المراجعة: ${errorMessage}`)
    }
  }

  // Handle login prompt
  const handleLoginPrompt = () => {
    setShowLoginPrompt(false)
    router.push("/auth/login")
  }

  // Handle see more button
  const handleSeeMore = () => {
    setVisibleReviews(reviews.length)
  }

  // Close modals
  const closeModals = () => {
    setShowReaderModal(false)
  }

  // Retry API connection
  const retryApiConnection = async () => {
    const status = await getApiStatus()
    setApiStatus(status)

    // Try to sync pending reviews if API is back online
    if (status.isOnline && isLoggedIn) {
      try {
        await syncPendingReviews()
        // Refresh reviews after sync
        if (book) {
          const bookReviews = await getBookReviews(book.externalId)
          setReviews(bookReviews)
          setReviewStats(calculateReviewStats(bookReviews))
        }
      } catch (error) {
        console.error("Error syncing pending reviews:", error)
      }
    }
  }

  if (loading) {
    return (
      <main>
        <Navigation />
        <div className="loading-container">
          <div className="loading">Loading book details...</div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!book) {
    return (
      <main>
        <Navigation />
        <div className="error-container">
          <div className="error-message">Book not found</div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Navigation />
      <HeroSection />

      {showLoginPrompt && (
        <div className="login-prompt">
          <div className="login-prompt-content">
            <h3>Login Required</h3>
            <p>You need to be logged in to use this feature.</p>
            <div className="login-prompt-buttons">
              <button className="btn btn-signup" onClick={handleLoginPrompt}>
                Login Now
              </button>
              <button className="btn btn-login" onClick={() => setShowLoginPrompt(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="book-details">
        <Image
          src={book.coverImageUrl || "/placeholder.svg"}
          alt={book.title}
          width={200}
          height={300}
          className="book-cover"
        />
        <div className="book-info">
          <h2 className="book-title">
            {book.title}
            {book.authors && book.authors.length > 0 && (
              <span>: {book.authors.map((author: any) => author.name).join(", ")}</span>
            )}
            <span className="book-stars">{"⭐".repeat(Math.round(reviewStats.average))}</span>
          </h2>
          <div className="book-stats">
            <div className="stat">
              <div className="stat-value book-rating">{reviewStats.average.toFixed(1)}</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-value">{book.subjects?.length || 0}</div>
              <div className="stat-label">Subjects</div>
            </div>
            <div className="stat">
              <div className="stat-value">Eng</div>
              <div className="stat-label">Language</div>
            </div>
          </div>
          <div className="book-actions">
            <button className="btn btn-signup" id="readNowBtn" onClick={handleReadNow}>
              Read now
            </button>
          </div>
          <div className="book-action-buttons">
            <button
              className={`action-btn favourite-btn ${isFav ? "active" : ""}`}
              onClick={handleFavorite}
              aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={isFav ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Favourite</span>
            </button>
            <button
              className={`action-btn bookmark-btn ${isBookmark ? "active" : ""}`}
              onClick={handleBookmark}
              aria-label={isBookmark ? "Remove from bookmarks" : "Add to bookmarks"}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={isBookmark ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Bookmark</span>
            </button>
            <button
              className={`action-btn download-btn ${isDownload ? "active" : ""}`}
              onClick={handleDownload}
              aria-label={isDownload ? "Downloaded" : "Download"}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download</span>
            </button>
          </div>
          {book.subjects && book.subjects.length > 0 && (
            <div className="book-tags">
              {book.subjects.slice(0, 3).map((subject: string, index: number) => (
                <div key={index} className="tag">
                  # {subject}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <span>📝</span> Description
        </div>
        <div className="description-content">
          {book.authors && book.authors.length > 0 && (
            <>
              <h3>About Authors</h3>
              <p>{book.authors.map((author: any) => author.name).join(", ")}</p>
            </>
          )}
          <h3>Overview</h3>
          <p>
            {book.subjects && book.subjects.length > 0
              ? `This book covers topics including: ${book.subjects.join(", ")}.`
              : "A fascinating read that will captivate your imagination."}
          </p>
        </div>
      </section>

      {/* Book Recommendations */}
      {book && <BookRecommendations currentBookTitle={book.title} currentBookId={book.id} />}

      <section className="section">
        <div className="section-title">
          <span>⭐</span> Ratings & reviews
        </div>

        {reviewsLoading ? (
          <div className="loading">Loading reviews...</div>
        ) : (
          <>
            <div className="rating-summary">
              <div className="overall-rating">
                <div className="rating-value">{reviewStats.average.toFixed(1)}</div>
                <div className="stars">
                  {"★".repeat(Math.floor(reviewStats.average))}
                  {"☆".repeat(5 - Math.floor(reviewStats.average))}
                </div>
                <div className="review-count">{reviewStats.total} Reviews</div>
              </div>
              <div className="rating-bars">
                {reviewStats.distribution.map((item: any) => (
                  <div key={item.stars} className="rating-bar">
                    <span>{item.stars}</span>
                    <div className="bar">
                      <div className="bar-fill" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="bar-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {canUserReview() && (
              <div className="review-form">
                <div className="stars-input">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="star-rating-container">
                      <input
                        type="radio"
                        name="rating"
                        id={`star${star}`}
                        value={star}
                        checked={reviewRating === star}
                        onChange={() => setReviewRating(star)}
                      />
                      <label
                        htmlFor={`star${star}`}
                        className={reviewRating >= star ? "filled" : ""}
                        onClick={() => setReviewRating(star)}
                      >
                        ★
                      </label>
                    </div>
                  ))}
                </div>
                <textarea
                  placeholder="Add feedback"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={1000}
                ></textarea>
                <button
                  className={`btn ${reviewText.trim() && reviewRating > 0 ? "btn-signup" : "btn-disabled"}`}
                  onClick={handlePostReview}
                  disabled={!reviewText.trim() || reviewRating === 0 || submittingReview}
                >
                  {submittingReview ? "Posting..." : "Post"}
                </button>
              </div>
            )}

            {!canUserReview() && (
              <div className="login-prompt-inline">
                <p>
                  Please{" "}
                  <button onClick={() => router.push("/auth/login")} className="link-button">
                    login
                  </button>{" "}
                  to add a review.
                </p>
              </div>
            )}

            <div className="reviews-list">
              {reviews.length === 0 && !reviewsLoading && (
                <div className="no-reviews">
                  <p>No reviews found for this book. Be the first to review!</p>
                </div>
              )}

              {reviews.slice(0, visibleReviews).map((review) => (
                <div key={review.id} className="review">
                  <div className="review-header">
                    <div className="review-avatar">
                      {review.user.profileImageUrl ? (
                        <Image
                          src={review.user.profileImageUrl || "/placeholder.svg"}
                          alt={review.user.username}
                          width={40}
                          height={40}
                          className="avatar-image"
                        />
                      ) : (
                        review.user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="review-info">
                      <h4>{review.user.username}</h4>
                      <div className="stars">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </div>
                      <div className="review-date">{formatReviewDate(review.createdAt)}</div>
                    </div>
                    {getCurrentUser() && getCurrentUser().id === review.userId && (
                      <button
                        className="delete-review-btn"
                        onClick={() => handleDeleteReview(review.id)}
                        aria-label="Delete review"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  {review.feedback && <p>{review.feedback}</p>}
                </div>
              ))}
            </div>

            {reviews.length > visibleReviews && (
              <button className="btn-see-more" onClick={handleSeeMore}>
                See more
              </button>
            )}
          </>
        )}
      </section>

      {/* Reader Modal */}
      {showReaderModal && (
        <div className="modal" onClick={closeModals}>
          <div className="modal-content reader-modal" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={closeModals}>
              &times;
            </span>
            <h2>{book.title} - Chapter 1</h2>
            <div className="reader-content">
              <p>The morning began like any other, with the soft patter of rain against the windowpane...</p>
              <p>This is a sample reading experience. The full content would be loaded from the API.</p>
              <p>
                As the plot thickens, the characters face unexpected challenges and revelations that will keep you
                turning pages.
              </p>
              <p>
                The ending will surprise you in ways you never imagined, bringing the story full circle with a
                satisfying conclusion.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
