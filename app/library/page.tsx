"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import AudioCard from "@/components/audio-card"
import HeroSection from "@/components/hero-section"
import { getRecentlyPlayed, getBookmarkedBooks, getFavoriteBooks } from "@/services/book-service"
import { getAllRecentlyPlayedAudio, getBookmarkedAudio, getFavoriteAudio } from "@/services/audio-service"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addCollectionChangeListener } from "@/services/book-service"

export default function Library() {
  const { isLoggedIn } = useAuth()

  // State to store book collections
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])

  // State to store audio collections
  const [recentlyPlayedAudio, setRecentlyPlayedAudio] = useState<any[]>([])
  const [bookmarkedAudio, setBookmarkedAudio] = useState<any[]>([])
  const [favoriteAudio, setFavoriteAudio] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [sectionsLoading, setSectionsLoading] = useState({
    recentlyPlayed: true,
    bookmarks: true,
    favorites: true,
    audio: true,
  })

  // Fetch latest data when component mounts or when user logs in/out
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn) {
        // Clear data when not logged in
        setRecentlyPlayed([])
        setBookmarks([])
        setFavorites([])
        setRecentlyPlayedAudio([])
        setBookmarkedAudio([])
        setFavoriteAudio([])
        setLoading(false)
        return
      }

      try {
        // Fetch all data in parallel for better performance
        const [recentBooks, bookmarkedBooks, favoriteBooks] = await Promise.all([
          getRecentlyPlayed().catch(() => []),
          getBookmarkedBooks().catch(() => []),
          getFavoriteBooks().catch(() => []),
        ])

        setRecentlyPlayed(Array.isArray(recentBooks) ? recentBooks.slice(0, 4) : [])
        setBookmarks(Array.isArray(bookmarkedBooks) ? bookmarkedBooks.slice(0, 4) : [])
        setFavorites(Array.isArray(favoriteBooks) ? favoriteBooks.slice(0, 4) : [])

        // Audio data (keeping existing sync functions)
        setRecentlyPlayedAudio(getAllRecentlyPlayedAudio().slice(0, 4))
        setBookmarkedAudio(getBookmarkedAudio().slice(0, 4))
        setFavoriteAudio(getFavoriteAudio().slice(0, 4))

        // Reset all loading states
        setSectionsLoading({
          recentlyPlayed: false,
          bookmarks: false,
          favorites: false,
          audio: false,
        })
      } catch (error) {
        console.error("Error fetching library data:", error)
        // Set empty arrays on error
        setRecentlyPlayed([])
        setBookmarks([])
        setFavorites([])
        setSectionsLoading({
          recentlyPlayed: false,
          bookmarks: false,
          favorites: false,
          audio: false,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Add listener for collection changes to refresh data immediately
    const removeListener = addCollectionChangeListener(() => {
      console.log("Collection changed, refreshing library data...")
      fetchData()
    })

    // Also refresh when the page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn) {
        fetchData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup listeners on unmount
    return () => {
      removeListener()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isLoggedIn])

  // Add a separate effect to refresh data when component mounts (user navigates to library)
  useEffect(() => {
    const refreshOnMount = async () => {
      if (isLoggedIn) {
        try {
          const [bookmarkedBooks, favoriteBooks] = await Promise.all([
            getBookmarkedBooks().catch(() => []),
            getFavoriteBooks().catch(() => []),
          ])

          setBookmarks(Array.isArray(bookmarkedBooks) ? bookmarkedBooks.slice(0, 4) : [])
          setFavorites(Array.isArray(favoriteBooks) ? favoriteBooks.slice(0, 4) : [])
        } catch (error) {
          console.error("Error refreshing library on mount:", error)
        }
      }
    }

    refreshOnMount()
  }, []) // Run only on mount

  return (
    <main>
      <Navigation />
      <HeroSection />

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recently Played</h2>
          <Link href="/recently-played" className="see-all">
            See all ›
          </Link>
        </div>
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          <TabsContent value="books">
            {sectionsLoading.recentlyPlayed ? (
              <div className="book-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-1"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : recentlyPlayed.length > 0 ? (
              <div className="book-grid">
                {recentlyPlayed.map((book) => (
                  <BookCard
                    key={`book-${book.id}`}
                    id={book.id}
                    title={book.title}
                    coverImage={book.coverImage || book.coverImageUrl}
                    rating={book.rating}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-8">
                <p className="text-lg mb-4">You haven't read any books recently</p>
                <p className="mb-6">Start exploring our library and read books that interest you</p>
                <Link href="/" className="btn btn-primary">
                  Browse Books
                </Link>
              </div>
            )}
          </TabsContent>
          <TabsContent value="audio">
            {sectionsLoading.audio ? (
              <div className="book-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-1"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : recentlyPlayedAudio.length > 0 ? (
              <div className="book-grid">
                {recentlyPlayedAudio.map((audio) => (
                  <AudioCard
                    key={`audio-${audio.id}`}
                    id={audio.id}
                    title={audio.title}
                    coverImage={audio.coverImage}
                    rating={audio.rating}
                    duration={audio.duration}
                    type={audio.type}
                    author={audio.author}
                    host={audio.host}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-8">
                <p className="text-lg mb-4">You haven't listened to any audio content recently</p>
                <p className="mb-6">Start exploring our audio library and listen to what interests you</p>
                <Link href="/audio" className="btn btn-primary">
                  Browse Audio Content
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Bookmarks</h2>
          <Link href="/bookmarks" className="see-all">
            See all ›
          </Link>
        </div>
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          <TabsContent value="books">
            {sectionsLoading.bookmarks ? (
              <div className="book-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-1"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : bookmarks.length > 0 ? (
              <div className="book-grid">
                {bookmarks.map((book) => (
                  <BookCard
                    key={`book-${book.id}`}
                    id={book.id}
                    title={book.title}
                    coverImage={book.coverImage || book.coverImageUrl}
                    rating={book.rating}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-8">
                <p className="text-lg mb-4">You haven't bookmarked any books yet</p>
                <p className="mb-6">Save books you plan to read later</p>
                <Link href="/" className="btn btn-primary">
                  Browse Books
                </Link>
              </div>
            )}
          </TabsContent>
          <TabsContent value="audio">
            {sectionsLoading.audio ? (
              <div className="book-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-1"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : bookmarkedAudio.length > 0 ? (
              <div className="book-grid">
                {bookmarkedAudio.map((audio) => (
                  <AudioCard
                    key={`audio-${audio.id}`}
                    id={audio.id}
                    title={audio.title}
                    coverImage={audio.coverImage}
                    rating={audio.rating}
                    duration={audio.duration}
                    type={audio.type}
                    author={audio.author}
                    host={audio.host}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-8">
                <p className="text-lg mb-4">You haven't bookmarked any audio content yet</p>
                <p className="mb-6">Save audio content you plan to listen to later</p>
                <Link href="/audio" className="btn btn-primary">
                  Browse Audio Content
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Favourites</h2>
          <Link href="/favourites" className="see-all">
            See all ›
          </Link>
        </div>
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          <TabsContent value="books">
            {sectionsLoading.favorites ? (
              <div className="book-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-1"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : favorites.length > 0 ? (
              <div className="book-grid">
                {favorites.map((book) => (
                  <BookCard
                    key={`book-${book.id}`}
                    id={book.id}
                    title={book.title}
                    coverImage={book.coverImage || book.coverImageUrl}
                    rating={book.rating}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-8">
                <p className="text-lg mb-4">You haven't added any books to your favorites</p>
                <p className="mb-6">Add books you like to your favorites for easy access</p>
                <Link href="/" className="btn btn-primary">
                  Browse Books
                </Link>
              </div>
            )}
          </TabsContent>
          <TabsContent value="audio">
            {sectionsLoading.audio ? (
              <div className="book-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-1"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : favoriteAudio.length > 0 ? (
              <div className="book-grid">
                {favoriteAudio.map((audio) => (
                  <AudioCard
                    key={`audio-${audio.id}`}
                    id={audio.id}
                    title={audio.title}
                    coverImage={audio.coverImage}
                    rating={audio.rating}
                    duration={audio.duration}
                    type={audio.type}
                    author={audio.author}
                    host={audio.host}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-8">
                <p className="text-lg mb-4">You haven't added any audio content to your favorites</p>
                <p className="mb-6">Add audio content you like to your favorites for easy access</p>
                <Link href="/audio" className="btn btn-primary">
                  Browse Audio Content
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Footer />
    </main>
  )
}
