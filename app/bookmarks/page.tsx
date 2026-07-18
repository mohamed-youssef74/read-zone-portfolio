"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import AudioCard from "@/components/audio-card"
import { getBookmarkedBooks } from "@/services/book-service"
import { getBookmarkedAudio } from "@/services/audio-service"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Bookmarks() {
  const { isLoggedIn } = useAuth()
  const [bookmarkedBooks, setBookmarkedBooks] = useState<any[]>([])
  const [bookmarkedAudio, setBookmarkedAudio] = useState<any[]>([])

  useEffect(() => {
    setBookmarkedBooks(getBookmarkedBooks())
    setBookmarkedAudio(getBookmarkedAudio())
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <main>
        <Navigation />
        <div className="hero">
          <div className="hero-content">
            <h1>Please login to view your bookmarks</h1>
            <Link href="/auth/login" className="btn btn-signup">
              Login
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Navigation />

      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Bookmarks</h1>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          <TabsContent value="books">
            {bookmarkedBooks.length > 0 ? (
              <div className="book-grid">
                {bookmarkedBooks.map((book) => (
                  <BookCard
                    key={`book-${book.id}`}
                    id={book.id}
                    title={book.title}
                    coverImage={book.coverImage}
                    rating={book.rating}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-12">
                <p className="text-xl mb-4">You haven't bookmarked any books yet.</p>
                <p className="mb-6">Browse our library and bookmark your favorite books.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="audio">
            {bookmarkedAudio.length > 0 ? (
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
              <div className="empty-section text-center py-12">
                <p className="text-xl mb-4">You haven't bookmarked any audio content yet.</p>
                <p className="mb-6">Browse our audio library and bookmark your favorite content.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </main>
  )
}
