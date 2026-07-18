"use client"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import AudioCard from "@/components/audio-card"
import { getRecentlyPlayed } from "@/services/book-service"
import { getAllRecentlyPlayedAudio } from "@/services/audio-service"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function RecentlyPlayed() {
  const { isLoggedIn } = useAuth()
  const [recentlyPlayedBooks, setRecentlyPlayedBooks] = useState<any[]>([])
  const [recentlyPlayedAudio, setRecentlyPlayedAudio] = useState<any[]>([])

  useEffect(() => {
    setRecentlyPlayedBooks(getRecentlyPlayed())
    setRecentlyPlayedAudio(getAllRecentlyPlayedAudio())
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <main>
        <Navigation />
        <div className="hero">
          <div className="hero-content">
            <h1>Please login to view your recently played content</h1>
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
        <h1 className="text-3xl font-bold mb-8">Recently Played</h1>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="audio">Audiobooks</TabsTrigger>
          </TabsList>
          <TabsContent value="books">
            {recentlyPlayedBooks.length > 0 ? (
              <div className="book-grid">
                {recentlyPlayedBooks.map((book) => (
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
                <p className="text-xl mb-4">You haven't played any books recently.</p>
                <p className="mb-6">Start exploring our library of books.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="audio">
            {recentlyPlayedAudio.length > 0 ? (
              <div className="book-grid">
                {recentlyPlayedAudio.map((audio) => (
                  <AudioCard
                    key={`audio-${audio.id}`}
                    id={audio.id}
                    title={audio.title}
                    coverImage={audio.coverImage}
                    rating={audio.rating}
                    duration={audio.duration}
                    type="audiobook"
                    author={audio.author}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-section text-center py-12">
                <p className="text-xl mb-4">You haven't played any audiobooks recently.</p>
                <p className="mb-6">Start exploring our library of audiobooks.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </main>
  )
}
