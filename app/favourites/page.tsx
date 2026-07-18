"use client"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookCard from "@/components/book-card"
import AudioCard from "@/components/audio-card"
import { getFavoriteBooks } from "@/services/book-service"
import { getFavoriteAudio } from "@/services/audio-service"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function Favourites() {
  const { isLoggedIn } = useAuth()
  const [favoriteBooks, setFavoriteBooks] = useState<any[]>([])
  const [favoriteAudio, setFavoriteAudio] = useState<any[]>([])

  useEffect(() => {
    setFavoriteBooks(getFavoriteBooks())
    setFavoriteAudio(getFavoriteAudio())
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <main>
        <Navigation />
        <div className="hero">
          <div className="hero-content">
            <h1>Please login to view your favourites</h1>
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
        <h1 className="text-3xl font-bold mb-8">Favourites</h1>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          <TabsContent value="books">
            {favoriteBooks.length > 0 ? (
              <div className="book-grid">
                {favoriteBooks.map((book) => (
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
                <p className="text-xl mb-4">You haven't added any books to your favourites yet.</p>
                <p className="mb-6">Browse our library and add your favorite books.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="audio">
            {favoriteAudio.length > 0 ? (
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
              <div className="empty-section text-center py-12">
                <p className="text-xl mb-4">You haven't added any audio content to your favourites yet.</p>
                <p className="mb-6">Browse our audio library and add your favorite content.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </main>
  )
}
