"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import {
  toggleFavorite,
  toggleBookmark,
  addToRecentlyPlayed,
  isFavorite,
  isBookmarked,
  addCollectionChangeListener,
} from "@/services/book-service"
import { toast } from "@/hooks/use-toast"

interface BookCardProps {
  id: number // Changed from string to number for API compatibility
  externalId?: number // Add externalId for API calls
  title: string
  coverImage?: string
  coverImageUrl?: string // API uses coverImageUrl
  rating?: number
  author?: string
  authors?: Array<{ name: string }> // API returns authors array
  showActions?: boolean
}

export default function BookCard({
  id,
  externalId,
  title,
  coverImage,
  coverImageUrl,
  rating = 0,
  author,
  authors,
  showActions = true,
}: BookCardProps) {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [isFav, setIsFav] = useState(false)
  const [isBookmark, setIsBookmark] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Use externalId if provided, otherwise use id
  const bookId = externalId || id

  // Get the cover image URL
  const imageUrl = coverImageUrl || coverImage || "/placeholder.svg"

  // Get author name
  const authorName = author || (authors && authors.length > 0 ? authors[0].name : "Unknown Author")

  // Update state when collections change
  useEffect(() => {
    const updateState = async () => {
      if (isLoggedIn && bookId) {
        try {
          const [favStatus, bookmarkStatus] = await Promise.all([isFavorite(bookId), isBookmarked(bookId)])
          setIsFav(favStatus)
          setIsBookmark(bookmarkStatus)

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import {
  toggleFavorite,
  toggleBookmark,
  addToRecentlyPlayed,
  isFavorite,
  isBookmarked,
  addCollectionChangeListener,
} from "@/services/book-service"
import { toast } from "@/hooks/use-toast"

interface BookCardProps {
  id: number // Changed from string to number for API compatibility
  externalId?: number // Add externalId for API calls
  title: string
  coverImage?: string
  coverImageUrl?: string // API uses coverImageUrl
  rating?: number
  author?: string
  authors?: Array<{ name: string }> // API returns authors array
  showActions?: boolean
  olid?: string // Open Library work id (fallback source)
}

export default function BookCard({
  id,
  externalId,
  title,
  coverImage,
  coverImageUrl,
  rating = 0,
  author,
  authors,
  showActions: showActionsProp = true,
  olid,
}: BookCardProps) {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [isFav, setIsFav] = useState(false)
  const [isBookmark, setIsBookmark] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Use externalId if provided, otherwise use id
  // Open Library items have no id in the main API: no favorites/bookmarks/history for them.
  const showActions = showActionsProp && !olid
  const bookId = olid ? 0 : externalId || id

  // Get the cover image URL
  const imageUrl = coverImageUrl || coverImage || "/placeholder.svg"

  // Get author name
  const authorName = author || (authors && authors.length > 0 ? authors[0].name : "Unknown Author")

  // Update state when collections change
  useEffect(() => {
    const updateState = async () => {
      if (isLoggedIn && bookId) {
        try {
          const [favStatus, bookmarkStatus] = await Promise.all([isFavorite(bookId), isBookmarked(bookId)])
          setIsFav(favStatus)
          setIsBookmark(bookmarkStatus)
        } catch (error) {
          console.error("Error updating book status:", error)
        }
      }
    }

    updateState()

    // Add listener for collection changes
    const removeListener = addCollectionChangeListener(updateState)

    // Cleanup listener on unmount
    return () => removeListener()
  }, [bookId, isLoggedIn])

  const handleClick = () => {
    // Add to recently played when clicking on a book
    if (isLoggedIn && bookId) {
      addToRecentlyPlayed(bookId).catch(console.error)
    }
    router.push(olid ? `/book/${olid}` : `/review/${bookId}`)
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigating to book details
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }

    if (!bookId) return

    setIsLoading(true)
    try {
      const newStatus = await toggleFavorite(bookId)
      setIsFav(newStatus)

      toast({
        title: newStatus ? "تمت الإضافة إلى المفضلة ✨" : "تمت الإزالة من المفضلة",
        description: `${title} - ستجده في مكتبتك`,
      })
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "حدث خطأ",
        description: "تعذر تحديث المفضلة. سيتم المحاولة مرة أخرى لاحقًا.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigating to book details
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }

    if (!bookId) return

    setIsLoading(true)
    try {
      const newStatus = await toggleBookmark(bookId)
      setIsBookmark(newStatus)

      toast({
        title: newStatus ? "تمت الإضافة إلى العلامات المرجعية 📚" : "تمت الإزالة من العلامات المرجعية",
        description: `${title} - ستجده في مكتبتك`,
      })
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      toast({
        title: "حدث خطأ",
        description: "تعذر تحديث العلامات المرجعية. سيتم المحاولة مرة أخرى لاحقًا.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="book-card" onClick={handleClick}>
      <div className="book-card-image-container">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          width={150}
          height={225}
          className="book-card-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=225&width=150"
          }}
        />

        {showActions && (
          <div className="book-card-actions">
            <button
              className={`book-action-btn favorite-btn ${isFav ? "active" : ""} ${isLoading ? "opacity-50" : ""}`}
              onClick={handleFavorite}
              disabled={isLoading}
              aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isFav ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>

            <button
              className={`book-action-btn bookmark-btn ${isBookmark ? "active" : ""} ${isLoading ? "opacity-50" : ""}`}
              onClick={handleBookmark}
              disabled={isLoading}
              aria-label={isBookmark ? "إزالة من العلامات المرجعية" : "إضافة إلى العلامات المرجعية"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isBookmark ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="book-info">
        <h3 className="book-title" style={olid ? { display: "block", overflowWrap: "anywhere", fontSize: "1.1rem" } : undefined}>
          {title}
        </h3>
        <p className="book-author">{authorName}</p>
        {/* Open Library items have no rating in our data, so none is shown. */}
        {!olid && rating > 0 && (
          <span className="book-rating">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            {rating}
          </span>
        )}
      </div>
    </div>
  )
}
