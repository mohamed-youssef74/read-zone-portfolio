"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AudioCard from "@/components/audio-card"
import { searchAudiobooks, type Audiobook } from "@/services/audio-service"
import { Search } from "lucide-react"

export default function AudioSearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [searchResults, setSearchResults] = useState<Audiobook[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(query)

  useEffect(() => {
    if (query) {
      handleSearch(query)
    }
  }, [query])

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results = await searchAudiobooks(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  return (
    <main>
      <Navigation />

      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audiobooks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        <div className="book-list-container">
          {query && (
            <h1 className="book-list-title">
              Search Results for "{query}" ({searchResults.length} found)
            </h1>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">Searching audiobooks...</p>
            </div>
          )}

          {!loading && searchResults.length === 0 && query && (
            <div className="text-center py-8">
              <p className="text-gray-500">No audiobooks found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-2">Try different keywords or browse our collection</p>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="section">
              <div className="book-grid-full">
                {searchResults.map((audiobook) => (
                  <AudioCard
                    key={audiobook.id}
                    id={audiobook.id}
                    title={audiobook.title}
                    coverImage={audiobook.coverImage}
                    rating={audiobook.rating}
                    duration={audiobook.duration}
                    type="audiobook"
                    author={audiobook.author}
                    narrator={audiobook.narrator}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
