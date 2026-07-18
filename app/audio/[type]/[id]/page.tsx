"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  getAudiobookById,
  toggleBookmark,
  toggleFavorite,
  toggleDownload,
  isBookmarked,
  isFavorite,
  isDownloaded,
  addToRecentlyPlayed,
  type Audiobook,
} from "@/services/audio-service"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AudioPlayer from "@/components/audio-player"
import { Clock, Headphones, Download, Heart, BookmarkPlus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function AudioDetailPage({ params }: { params: { type: string; id: string } }) {
  const { type, id } = params
  const [audioData, setAudioData] = useState<Audiobook | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPlayer, setShowPlayer] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    async function fetchAudioData() {
      try {
        setLoading(true)
        const data = await getAudiobookById(id)
        setAudioData(data || null)

        if (data) {
          setBookmarked(isBookmarked(id, "audiobook"))
          setFavorited(isFavorite(id, "audiobook"))
          setDownloaded(isDownloaded(id, "audiobook"))
        }
      } catch (error) {
        console.error("Error fetching audio data:", error)
        setAudioData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAudioData()
  }, [id])

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto py-10 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading audiobook...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!audioData) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
          <p className="mb-4">Sorry, we couldn't find the requested audiobook.</p>
          <Link href="/audio" className="btn btn-primary">
            Return to Audio
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const handlePlayClick = () => {
    addToRecentlyPlayed(id, "audiobook")
    setShowPlayer(true)
  }

  const handleBookmarkClick = () => {
    const isNowBookmarked = toggleBookmark(id, "audiobook")
    setBookmarked(isNowBookmarked)
    toast({
      title: isNowBookmarked ? "Bookmarked" : "Bookmark removed",
      description: isNowBookmarked
        ? `${audioData.title} has been added to your bookmarks`
        : `${audioData.title} has been removed from your bookmarks`,
    })
  }

  const handleFavoriteClick = () => {
    const isNowFavorite = toggleFavorite(id, "audiobook")
    setFavorited(isNowFavorite)
    toast({
      title: isNowFavorite ? "Added to Favorites" : "Removed from Favorites",
      description: isNowFavorite
        ? `${audioData.title} has been added to your favorites`
        : `${audioData.title} has been removed from your favorites`,
    })
  }

  const handleDownloadClick = () => {
    const isNowDownloaded = toggleDownload(id, "audiobook")
    setDownloaded(isNowDownloaded)
    toast({
      title: isNowDownloaded ? "Downloaded" : "Download removed",
      description: isNowDownloaded
        ? `${audioData.title} has been downloaded for offline listening`
        : `${audioData.title} has been removed from your downloads`,
    })
  }

  return (
    <div>
      <Navigation />

      <div className="container mx-auto py-8">
        <div className="book-details">
          <div className="flex flex-col items-center">
            <Image
              src={audioData.coverImage || "/placeholder.svg"}
              alt={audioData.title}
              width={200}
              height={300}
              className="book-cover mb-4"
            />
            <div className="flex gap-2 mt-2">
              <button className={`action-btn ${favorited ? "text-red-500" : ""}`} onClick={handleFavoriteClick}>
                <Heart size={18} />
              </button>
              <button className={`action-btn ${bookmarked ? "text-blue-500" : ""}`} onClick={handleBookmarkClick}>
                <BookmarkPlus size={18} />
              </button>
              <button className={`action-btn ${downloaded ? "text-green-500" : ""}`} onClick={handleDownloadClick}>
                <Download size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="book-title">{audioData.title}</h1>
            <p className="mb-2">
              Author: {audioData.author} | Narrator: {audioData.narrator}
            </p>

            <div className="book-stats">
              <div className="stat">
                <div className="stat-value">{audioData.rating.toFixed(1)}</div>
                <div className="stat-label">Rating</div>
              </div>
              <div className="stat">
                <div className="stat-value">{audioData.duration}</div>
                <div className="stat-label">Duration</div>
              </div>
              <div className="stat">
                <div className="stat-value">{audioData.language}</div>
                <div className="stat-label">Language</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {audioData.categories.map((category, index) => (
                <span key={index} className="tag">
                  {category}
                </span>
              ))}
            </div>

            <button onClick={handlePlayClick} className="btn btn-primary flex items-center gap-2 mb-6">
              <Headphones size={18} />
              <span>Listen Now</span>
            </button>

            <div className="description-content">
              <h3 className="text-xl font-semibold mb-2">About this Book</h3>
              <p className="text-gray-700">{audioData.description}</p>
            </div>

            {audioData.chapters && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Chapters</h3>
                <div className="space-y-2">
                  {audioData.chapters.map((chapter) => (
                    <div key={chapter.id} className="p-3 bg-gray-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{chapter.title}</h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock size={14} className="mr-1" />
                          <span>{chapter.duration}</span>
                        </div>
                      </div>
                      <button
                        className="text-sm text-blue-500 mt-2 flex items-center gap-1"
                        onClick={() => {
                          addToRecentlyPlayed(id, "audiobook")
                          setShowPlayer(true)
                        }}
                      >
                        <Headphones size={14} />
                        <span>Listen</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPlayer && (
        <div className="modal">
          <div className="modal-content player-modal">
            <button className="close-button" onClick={() => setShowPlayer(false)}>
              &times;
            </button>
            <AudioPlayer
              audioSrc={audioData.audioFile}
              title={audioData.title}
              author={audioData.author}
              chapters={audioData.chapters}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
