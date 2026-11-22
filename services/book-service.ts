import { olPopular, olSubject, olNew, olSearch } from "./openlibrary"
import { booksApi, userLibraryApi, storeApi, offlineBooksApi, recommendationsApi, bookSectionsApi } from "./api-service"

// Types based on the API schema
export interface Book {
  id: number
  externalId: number
  title: string
  authors: Author[]
  subjects: string[]
  formats: { [key: string]: string }
  coverImageUrl?: string
  bookAuthors?: BookAuthor[]
  orderItems?: any[]
  reviews?: Review[]
}

export interface Author {
  id: number
  name: string
  bookAuthors?: BookAuthor[]
}

export interface BookAuthor {
  bookId: number
  book: Book
  authorId: number
  author: Author
}

export interface Review {
  id: number
  rating: number
  feedback?: string
  createdAt: string
  userId: number
  user: any
  bookId: number
  book: Book
}

// Available book sections from API
export const BOOK_SECTIONS = {
  FICTION: "fiction",
  ROMANCE: "romance",
  HISTORY: "history",
  ADVENTURE: "adventure",
  PHILOSOPHY: "philosophy",
  DRAMA: "drama",
  MYSTERY: "mystery",
  CHILDREN: "children",
  SCIENCE: "science",
  FANTASY: "fantasy",
} as const

export type BookSection = (typeof BOOK_SECTIONS)[keyof typeof BOOK_SECTIONS]

// Event listeners for collection changes
const collectionChangeListeners: (() => void)[] = []

// Function to notify listeners when collections change
function notifyCollectionChange() {
  collectionChangeListeners.forEach((listener) => listener())
}

// Add a listener for collection changes
export function addCollectionChangeListener(listener: () => void) {
  collectionChangeListeners.push(listener)
  return () => {
    const index = collectionChangeListeners.indexOf(listener)
    if (index > -1) {
      collectionChangeListeners.splice(index, 1)
    }
  }
}

// Helper function to ensure we always return an array
function ensureArray(data: any): any[] {
  if (Array.isArray(data)) {
    return data
  }
  if (data && typeof data === "object" && data.data && Array.isArray(data.data)) {
    return data.data
  }
  return []
}

// === BOOKS API FUNCTIONS ===

// Get new books
export async function getNewBooks(): Promise<Book[]> {
  try {
    const books = await booksApi.getNewBooks()
    return ensureArray(books)
  } catch (error) {
    console.error("Error fetching new books:", error)
    return []
  }
}

// Get popular books
export async function getPopularBooks(): Promise<Book[]> {
  try {
    const books = await booksApi.getPopularBooks()
    return ensureArray(books)
  } catch (error) {
    console.error("Error fetching popular books:", error)
    return []
  }
}

// Get grouped books
export async function getGroupedBooks(): Promise<any> {
  try {
    const books = await booksApi.getGroupedBooks()
    return books || {}
  } catch (error) {
    console.error("Error fetching grouped books:", error)
    return {}
  }
}

// Search books
export async function searchBooks(query: string): Promise<Book[]> {
  if (!query.trim()) return []

  try {
    const books = ensureArray(await booksApi.searchBooks(query))
    if (books.length > 0) return books
  } catch (error) {
    console.error("Error searching books:", error)
  }
  try {
    const res = await fetch(`/api/ol-search?q=${encodeURIComponent(query)}`)
    return res.ok ? ensureArray(await res.json()) : []
  } catch {
    return []
  }
}

// Get books by section using the API endpoints from Swagger
export async function getBooksBySection(section: BookSection): Promise<Book[]> {
  try {
    let books: any[] = []

    switch (section) {
      case BOOK_SECTIONS.FICTION:
        books = await bookSectionsApi.getFictionBooks()
        break
      case BOOK_SECTIONS.ROMANCE:
        books = await bookSectionsApi.getRomanceBooks()
        break
      case BOOK_SECTIONS.HISTORY:
        books = await bookSectionsApi.getHistoryBooks()
        break
      case BOOK_SECTIONS.ADVENTURE:
        books = await bookSectionsApi.getAdventureBooks()
        break
      case BOOK_SECTIONS.PHILOSOPHY:
        books = await bookSectionsApi.getPhilosophyBooks()
        break
      case BOOK_SECTIONS.DRAMA:
        books = await bookSectionsApi.getDramaBooks()
        break
      case BOOK_SECTIONS.MYSTERY:
        books = await bookSectionsApi.getMysteryBooks()
        break
      case BOOK_SECTIONS.CHILDREN:
        books = await bookSectionsApi.getChildrenBooks()
        break
      case BOOK_SECTIONS.SCIENCE:
        books = await bookSectionsApi.getScienceBooks()
        break
      case BOOK_SECTIONS.FANTASY:
        books = await bookSectionsApi.getFantasyBooks()
        break
      default:
        console.warn(`Unknown section: ${section}`)
        return []
    }

    const list = ensureArray(books)
    return list.length > 0 ? list : await olSubject(section)
  } catch (error) {
    console.error(`Error fetching ${section} books:`, error)
    try {
      return await olSubject(section)
    } catch {
      return []
    }
  }
}

// Get fiction books
export async function getFictionBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.FICTION)
}

// Get romance books
export async function getRomanceBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.ROMANCE)
}

// Get history books
export async function getHistoryBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.HISTORY)
}

// Get adventure books
export async function getAdventureBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.ADVENTURE)
}

// Get philosophy books
export async function getPhilosophyBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.PHILOSOPHY)
}

// Get drama books
export async function getDramaBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.DRAMA)
}

// Get mystery books
export async function getMysteryBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.MYSTERY)
}

// Get children books
export async function getChildrenBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.CHILDREN)
}

// Get science books
export async function getScienceBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.SCIENCE)
}

// Get fantasy books
export async function getFantasyBooks(): Promise<Book[]> {
  return getBooksBySection(BOOK_SECTIONS.FANTASY)
}

// Get all available sections
export async function getAllSections(): Promise<BookSection[]> {
  return Object.values(BOOK_SECTIONS)
}

// Get books for multiple sections
export async function getBooksForSections(sections: BookSection[]): Promise<{ [key: string]: Book[] }> {
  try {
    const results: { [key: string]: Book[] } = {}

    // Fetch all sections in parallel
    const promises = sections.map(async (section) => {
      const books = await getBooksBySection(section)
      return { section, books }
    })

    const sectionResults = await Promise.allSettled(promises)

    sectionResults.forEach((result) => {
      if (result.status === "fulfilled") {
        const { section, books } = result.value
        results[section] = books
      }
    })

    return results
  } catch (error) {
    console.error("Error fetching books for sections:", error)
    return {}
  }
}

// Get book by ID from store
export async function getBookById(id: number): Promise<Book | null> {
  try {
    const book = await storeApi.getBookById(id)
    return book || null
  } catch (error) {
    console.error("Error fetching book by ID:", error)
    return null
  }
}

// Get book content
export async function getBookContent(id: number): Promise<any> {
  try {
    const content = await booksApi.getBookContent(id)
    return content
  } catch (error) {
    console.error("Error fetching book content:", error)
    return null
  }
}

// === USER LIBRARY FUNCTIONS ===

// Get favorite books
export async function getFavoriteBooks(): Promise<Book[]> {
  try {
    const favorites = await userLibraryApi.getFavorites()
    return ensureArray(favorites)
  } catch (error) {
    console.error("Error fetching favorite books:", error)
    return []
  }
}

// Get bookmarked books
export async function getBookmarkedBooks(): Promise<Book[]> {
  try {
    const bookmarks = await userLibraryApi.getBookmarks()
    return ensureArray(bookmarks)
  } catch (error) {
    console.error("Error fetching bookmarked books:", error)
    return []
  }
}

// Get downloaded books
export async function getDownloadedBooks(): Promise<Book[]> {
  try {
    const downloads = await userLibraryApi.getDownloads()
    return ensureArray(downloads)
  } catch (error) {
    console.error("Error fetching downloaded books:", error)
    return []
  }
}

// Get recently played audiobooks
export async function getRecentlyPlayed(): Promise<any[]> {
  try {
    const recent = await userLibraryApi.getRecentAudioBooks()
    return ensureArray(recent)
  } catch (error) {
    console.error("Error fetching recent audiobooks:", error)
    return []
  }
}

// Toggle favorite status
export async function toggleFavorite(externalBookId: number): Promise<boolean> {
  try {
    // First check if it's already a favorite
    const favorites = await getFavoriteBooks()
    const isFav = favorites.some((book) => book.externalId === externalBookId)

    if (isFav) {
      await userLibraryApi.removeFromFavorites(externalBookId)
    } else {
      await userLibraryApi.addToFavorites(externalBookId)
    }

    // Always notify collection change after successful API call
    notifyCollectionChange()
    return !isFav
  } catch (error) {
    console.error("Error toggling favorite:", error)
    throw error
  }
}

// Toggle bookmark status
export async function toggleBookmark(externalBookId: number): Promise<boolean> {
  try {
    // First check if it's already bookmarked
    const bookmarks = await getBookmarkedBooks()
    const isBookmark = bookmarks.some((book) => book.externalId === externalBookId)

    if (isBookmark) {
      await userLibraryApi.removeFromBookmarks(externalBookId)
    } else {
      await userLibraryApi.addToBookmarks(externalBookId)
    }

    // Always notify collection change after successful API call
    notifyCollectionChange()
    return !isBookmark
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    throw error
  }
}

// Add to downloads
export async function addToDownloads(externalBookId: number): Promise<boolean> {
  try {
    await userLibraryApi.addToDownloads(externalBookId)

    // Also try to download the book for offline reading
    try {
      await offlineBooksApi.downloadBook(externalBookId)
    } catch (offlineError) {
      console.warn("Could not download book for offline reading:", offlineError)
    }

    notifyCollectionChange()
    return true
  } catch (error) {
    console.error("Error adding to downloads:", error)
    throw error
  }
}

// Remove from downloads
export async function removeFromDownloads(externalBookId: number): Promise<boolean> {
  try {
    await userLibraryApi.removeFromDownloads(externalBookId)
    notifyCollectionChange()
    return true
  } catch (error) {
    console.error("Error removing from downloads:", error)
    throw error
  }
}

// Add to recently played audiobooks
export async function addToRecentlyPlayed(identifier: string | number): Promise<void> {
  try {
    await userLibraryApi.addToRecentAudioBooks(String(identifier))
    // Notify collection change so library updates
    notifyCollectionChange()
  } catch (error) {
    console.error("Error adding to recent audiobooks:", error)
  }
}

// Check functions - these will fetch fresh data from API each time
export async function isFavorite(externalBookId: number): Promise<boolean> {
  try {
    const favorites = await getFavoriteBooks()
    return favorites.some((book) => book.externalId === externalBookId)
  } catch (error) {
    console.error("Error checking favorite status:", error)
    return false
  }
}

export async function isBookmarked(externalBookId: number): Promise<boolean> {
  try {
    const bookmarks = await getBookmarkedBooks()
    return bookmarks.some((book) => book.externalId === externalBookId)
  } catch (error) {
    console.error("Error checking bookmark status:", error)
    return false
  }
}

export async function isDownloaded(externalBookId: number): Promise<boolean> {
  try {
    const downloads = await getDownloadedBooks()
    return downloads.some((book) => book.externalId === externalBookId)
  } catch (error) {
    console.error("Error checking download status:", error)
    return false
  }
}

// Fetch user library data (for initialization)
export async function fetchUserLibrary(): Promise<boolean> {
  try {
    // This function can be used to initialize user library data
    return true
  } catch (error) {
    console.error("Error fetching user library:", error)
    return false
  }
}

// Check API connectivity
export async function checkApiConnectivity(): Promise<boolean> {
  try {
    const response = await fetch("https://myfirstapi.runasp.net/api/Books/new")
    return response.ok
  } catch (error) {
    console.error("API connectivity check failed:", error)
    return false
  }
}

// Store API functions
export async function getTopSellers(): Promise<Book[]> {
  try {
    const books = await storeApi.getTopSellers()
    return ensureArray(books)
  } catch (error) {
    console.error("Error fetching top sellers:", error)
    return []
  }
}

// Get new arrivals
export async function getNewArrivals(): Promise<Book[]> {
  try {
    const books = await storeApi.getNewArrivals()
    return ensureArray(books)
  } catch (error) {
    console.error("Error fetching new arrivals:", error)
    return []
  }
}

// Get special offers
export async function getSpecialOffers(): Promise<Book[]> {
  try {
    const books = await storeApi.getSpecialOffers()
    return ensureArray(books)
  } catch (error) {
    console.error("Error fetching special offers:", error)
    return []
  }
}

// Offline Books functions
export async function getOfflineBooks(): Promise<Book[]> {
  try {
    const books = await offlineBooksApi.getAllOfflineBooks()
    return ensureArray(books)
  } catch (error) {
    console.error("Error fetching offline books:", error)
    return []
  }
}

export async function getOfflineBook(externalBookId: number): Promise<Book | null> {
  try {
    const book = await offlineBooksApi.getOfflineBook(externalBookId)
    return book
  } catch (error) {
    console.error("Error fetching offline book:", error)
    return null
  }
}

// Get book recommendations by title
export async function getBookRecommendations(title: string): Promise<Book[]> {
  if (!title.trim()) return []

  try {
    const recommendations = await recommendationsApi.getSimilarBooks(title)
    return ensureArray(recommendations)
  } catch (error) {
    console.error("Error fetching book recommendations:", error)
    return []
  }
}


// Result that tells "the list could not be loaded" apart from "the list is really empty".
// Tries the main API first, then the Open Library fallback if given.
export interface BookListResult {
  books: Book[]
  error: boolean
}

export async function loadBookList(loader: () => Promise<any>, fallback?: () => Promise<Book[]>): Promise<BookListResult> {
  let failed = false
  try {
    const books = ensureArray(await loader())
    if (books.length > 0) return { books, error: false }
  } catch (error) {
    console.error("Book list request failed:", error)
    failed = true
  }
  if (fallback) {
    try {
      const books = await fallback()
      if (books.length > 0) return { books, error: false }
    } catch (error) {
      console.error("Fallback book list failed:", error)
      failed = true
    }
  }
  return { books: [], error: failed }
}

export const loadPopularBooks = () => loadBookList(() => booksApi.getPopularBooks(), () => olPopular())
export const loadNewBooks = () => loadBookList(() => booksApi.getNewBooks(), () => olNew())
export const loadFictionBooks = () => loadBookList(() => bookSectionsApi.getFictionBooks(), () => olSubject("fiction"))
export const loadNewArrivals = () => loadBookList(() => storeApi.getNewArrivals(), () => olNew())
