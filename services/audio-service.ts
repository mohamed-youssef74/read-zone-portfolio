import { audioBooksApi, userLibraryApi } from "./api-service"

// Real API AudioBook data models (matching Swagger schema)
export interface ApiAudioBook {
  id: number
  title: string | null
  identifier: string | null
  creator: string | null
  coverUrl: string | null
  streamUrl: string | null
  duration?: string | null
}

// Local AudioBook interface for compatibility
export interface Audiobook {
  id: string
  title: string
  author: string
  narrator: string
  description: string
  coverImage: string
  audioFile: string
  duration: string
  rating: number
  categories: string[]
  releaseDate: string
  language: string
  chapters?: Chapter[]
}

export interface Chapter {
  id: string
  title: string
  duration: string
  startTime: number
}

export interface AudioItem {
  id: string
  type: "audiobook" | "podcast"
  title: string
  author?: string
  host?: string
  coverImage: string
  duration: string
  rating: number
}

// Helper function to convert API AudioBook to local Audiobook format
function convertApiAudioBook(apiBook: ApiAudioBook): Audiobook {
  return {
    id: apiBook.identifier || apiBook.id.toString(),
    title: apiBook.title || "Unknown Title",
    author: apiBook.creator || "Unknown Author",
    narrator: apiBook.creator || "Unknown Narrator",
    description: `An audiobook by ${apiBook.creator || "Unknown Author"}`,
    coverImage: apiBook.coverUrl || "/placeholder.svg?height=300&width=200",
    audioFile: apiBook.streamUrl || "",
    duration: apiBook.duration || "0:00:00",
    rating: 4.0 + Math.random(), // Generate random rating since API doesn't provide
    categories: ["General"], // API doesn't provide categories
    releaseDate: new Date().toISOString().split("T")[0],
    language: "English",
  }
}

// === API FUNCTIONS ===

export async function getAllAudiobooks(): Promise<Audiobook[]> {
  try {
    const apiBooks = await audioBooksApi.getHomeAudioBooks()
    return (apiBooks || []).map(convertApiAudioBook)
  } catch (error) {
    console.error("Error fetching audiobooks from API:", error)
    return []
  }
}

export async function searchAudiobooks(keyword: string): Promise<Audiobook[]> {
  if (!keyword.trim()) {
    return getAllAudiobooks()
  }

  try {
    const apiBooks = await audioBooksApi.searchAudioBooks(keyword)
    return (apiBooks || []).map(convertApiAudioBook)
  } catch (error) {
    console.error("Error searching audiobooks from API:", error)
    return []
  }
}

export async function getAudiobookById(id: string): Promise<Audiobook | undefined> {
  try {
    const apiBook = await audioBooksApi.getAudioBookById(id)
    if (apiBook) {
      return convertApiAudioBook(apiBook)
    }
    return undefined
  } catch (error) {
    console.error("Error fetching audiobook by identifier from API:", error)
    return undefined
  }
}

// === USER LIBRARY FUNCTIONS ===

export async function getAllRecentlyPlayedAudio(): Promise<AudioItem[]> {
  try {
    const recentAudioBooks = await userLibraryApi.getRecentAudioBooks()
    return (recentAudioBooks || []).map((book: any) => ({
      id: book.identifier || book.id?.toString() || "",
      type: "audiobook" as const,
      title: book.title || "Unknown Title",
      author: book.creator || "Unknown Author",
      coverImage: book.coverUrl || "/placeholder.svg?height=300&width=200",
      duration: book.duration || "0:00:00",
      rating: 4.0 + Math.random(),
    }))
  } catch (error) {
    console.error("Error fetching recent audiobooks:", error)
    return []
  }
}

export async function getBookmarkedAudio(): Promise<AudioItem[]> {
  // This would need a specific API endpoint for bookmarked audiobooks
  // For now, return empty array
  return []
}

export async function getFavoriteAudio(): Promise<AudioItem[]> {
  // This would need a specific API endpoint for favorite audiobooks
  // For now, return empty array
  return []
}

export async function getDownloadedAudio(): Promise<AudioItem[]> {
  // This would need a specific API endpoint for downloaded audiobooks
  // For now, return empty array
  return []
}

// Add to recently played
export function addToRecentlyPlayed(id: string, type: "audiobook" | "podcast", episodeId?: string, progress = 0) {
  if (type === "audiobook") {
    userLibraryApi.addToRecentAudioBooks(id).catch((error) => {
      console.error("Error adding to recent audiobooks:", error)
    })
  }
}

// These functions are no longer needed as we don't store data locally
export function toggleBookmark(id: string, type: "audiobook" | "podcast"): boolean {
  console.warn("toggleBookmark: Local storage removed. Use API endpoints instead.")
  return false
}

export function isBookmarked(id: string, type: "audiobook" | "podcast"): boolean {
  console.warn("isBookmarked: Local storage removed. Use API endpoints instead.")
  return false
}

export function toggleFavorite(id: string, type: "audiobook" | "podcast"): boolean {
  console.warn("toggleFavorite: Local storage removed. Use API endpoints instead.")
  return false
}

export function isFavorite(id: string, type: "audiobook" | "podcast"): boolean {
  console.warn("isFavorite: Local storage removed. Use API endpoints instead.")
  return false
}

export function toggleDownload(id: string, type: "audiobook" | "podcast"): boolean {
  console.warn("toggleDownload: Local storage removed. Use API endpoints instead.")
  return false
}

export function isDownloaded(id: string, type: "audiobook" | "podcast"): boolean {
  console.warn("isDownloaded: Local storage removed. Use API endpoints instead.")
  return false
}

// Legacy functions for compatibility
export function getAllPodcasts() {
  return []
}

export function getPodcastById(id: string) {
  return undefined
}

export function getRecentlyPlayedAudiobooks() {
  return []
}

export function getRecentlyPlayedPodcasts() {
  return []
}
