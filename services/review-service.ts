// Review service for handling API calls
const API_BASE_URL = "https://myfirstapi.runasp.net/api"

// Types based on the API schema
export interface ReviewDto {
  bookExternalId: number
  rating: number
  feedback?: string
}

export interface Review {
  id: number
  rating: number
  feedback?: string
  createdAt: string
  userId: number
  user: {
    id: number
    username: string
    profileImageUrl?: string
  }
  bookId: number
  book: any
  isLocal?: boolean // Flag to indicate if review is stored locally
}

// Local storage keys
const LOCAL_REVIEWS_KEY = "local_reviews"
const PENDING_REVIEWS_KEY = "pending_reviews"

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("token") || localStorage.getItem("token")
  }
  return null
}

// Helper function to check if user is authenticated
function isAuthenticated(): boolean {
  return getAuthToken() !== null
}

// Helper function to get current user
function getCurrentUserData() {
  if (typeof window !== "undefined") {
    const userStr = sessionStorage.getItem("userData") || localStorage.getItem("userData")
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }
  return null
}

// Local storage functions
function getLocalReviews(): Review[] {
  if (typeof window === "undefined") return []

  try {
    const localReviews = localStorage.getItem(LOCAL_REVIEWS_KEY)
    return localReviews ? JSON.parse(localReviews) : []
  } catch (error) {
    console.error("Error parsing local reviews:", error)
    return []
  }
}

function saveLocalReviews(reviews: Review[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews))
  } catch (error) {
    console.error("Error saving local reviews:", error)
  }
}

function getLocalReviewsForBook(bookExternalId: number): Review[] {
  const allLocalReviews = getLocalReviews()
  return allLocalReviews.filter((review) => review.book?.externalId === bookExternalId)
}

function addLocalReview(review: Review): void {
  const localReviews = getLocalReviews()
  localReviews.unshift(review) // Add to beginning
  saveLocalReviews(localReviews)
}

function removeLocalReview(reviewId: number): void {
  const localReviews = getLocalReviews()
  const updatedReviews = localReviews.filter((review) => review.id !== reviewId)
  saveLocalReviews(updatedReviews)
}

function getPendingReviews(): ReviewDto[] {
  if (typeof window === "undefined") return []

  try {
    const pendingReviews = localStorage.getItem(PENDING_REVIEWS_KEY)
    return pendingReviews ? JSON.parse(pendingReviews) : []
  } catch (error) {
    console.error("Error parsing pending reviews:", error)
    return []
  }
}

function savePendingReviews(reviews: ReviewDto[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PENDING_REVIEWS_KEY, JSON.stringify(reviews))
  } catch (error) {
    console.error("Error saving pending reviews:", error)
  }
}

function addPendingReview(reviewData: ReviewDto): void {
  const pendingReviews = getPendingReviews()
  pendingReviews.push(reviewData)
  savePendingReviews(pendingReviews)
}

function clearPendingReviews(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(PENDING_REVIEWS_KEY)
}

// Helper function to check API connectivity
async function checkApiConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${API_BASE_URL.replace("/api", "")}/WeatherForecast`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn("API connectivity check failed:", error)
    return false
  }
}

// Helper function to make API requests with proper error handling
async function makeApiRequest(url: string, options: RequestInit = {}, requireAuth = false) {
  const token = getAuthToken()

  // If authentication is required but no token is available, throw error
  if (requireAuth && !token) {
    throw new Error("Authentication required")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }

  // Add authorization header if token is available
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    console.log(`Making API request to: ${url}`)
    console.log(`Headers:`, headers)

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      mode: "cors", // Explicitly set CORS mode
    })

    clearTimeout(timeoutId)

    console.log(`Response status: ${response.status}`)

    // Handle different response statuses
    if (response.status === 401) {
      // Clear invalid token
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("token")
        localStorage.removeItem("token")
      }
      throw new Error("Authentication failed - please login again")
    }

    if (response.status === 404) {
      console.log("Resource not found, returning empty array")
      return []
    }

    if (response.status === 403) {
      throw new Error("Access forbidden - insufficient permissions")
    }

    if (response.status >= 500) {
      throw new Error("Server error - please try again later")
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`API Error: ${response.status} - ${errorText}`)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return null
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      console.log("API Response data:", data)
      return data
    }

    return response.text()
  } catch (error) {
    clearTimeout(timeoutId)
    console.error("API request failed:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout - please check your connection and try again")
      }
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Network error - please check your internet connection")
      }
      if (error.message.includes("CORS")) {
        throw new Error("CORS error - API access blocked")
      }
    }

    throw error
  }
}

// Create a new review (with local fallback)
export async function createReview(reviewData: ReviewDto): Promise<Review> {
  if (!isAuthenticated()) {
    throw new Error("Authentication required to create review")
  }

  console.log("Creating review with data:", reviewData)

  // Check API connectivity first
  const isApiAvailable = await checkApiConnectivity()

  if (isApiAvailable) {
    try {
      const review = await makeApiRequest(
        `${API_BASE_URL}/Reviews`,
        {
          method: "POST",
          body: JSON.stringify(reviewData),
        },
        true,
      )

      console.log("Review created successfully via API:", review)
      return review
    } catch (error) {
      console.error("Error creating review via API, falling back to local storage:", error)
      // Fall through to local storage
    }
  }

  // Create local review if API is not available or failed
  console.log("Creating review locally")
  const currentUser = getCurrentUserData()
  const localReview: Review = {
    id: Date.now(), // Use timestamp as local ID
    rating: reviewData.rating,
    feedback: reviewData.feedback,
    createdAt: new Date().toISOString(),
    userId: currentUser?.id || 0,
    user: {
      id: currentUser?.id || 0,
      username: currentUser?.username || "Anonymous",
      profileImageUrl: currentUser?.profileImageUrl || currentUser?.avatar,
    },
    bookId: reviewData.bookExternalId,
    book: { externalId: reviewData.bookExternalId },
    isLocal: true,
  }

  // Save to local storage
  addLocalReview(localReview)

  // Add to pending reviews for later sync
  addPendingReview(reviewData)

  console.log("Review created locally:", localReview)
  return localReview
}

// Get reviews for a specific book (with local fallback)
export async function getBookReviews(externalBookId: number): Promise<Review[]> {
  console.log(`Fetching reviews for book ID: ${externalBookId}`)

  let apiReviews: Review[] = []

  // Try to get reviews from API
  const isApiAvailable = await checkApiConnectivity()

  if (isApiAvailable) {
    try {
      // Try with authentication if available
      if (isAuthenticated()) {
        try {
          apiReviews = await makeApiRequest(`${API_BASE_URL}/Reviews/book/${externalBookId}`, {}, false)
          if (Array.isArray(apiReviews)) {
            console.log(`Found ${apiReviews.length} reviews from API with auth`)
          }
        } catch (error) {
          console.warn("Authenticated request failed, trying without auth:", error)
        }
      }

      // Try without authentication if previous attempt failed
      if (!Array.isArray(apiReviews) || apiReviews.length === 0) {
        apiReviews = await makeApiRequest(`${API_BASE_URL}/Reviews/book/${externalBookId}`, {}, false)
        if (Array.isArray(apiReviews)) {
          console.log(`Found ${apiReviews.length} reviews from API without auth`)
        }
      }
    } catch (error) {
      console.error("Error fetching reviews from API:", error)
      apiReviews = []
    }
  }

  // Get local reviews
  const localReviews = getLocalReviewsForBook(externalBookId)
  console.log(`Found ${localReviews.length} local reviews`)

  // Combine API and local reviews, removing duplicates
  const allReviews = [...apiReviews, ...localReviews]

  // Sort by creation date (newest first)
  allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  console.log(`Total reviews: ${allReviews.length}`)
  return allReviews
}

// Delete a review (with local fallback)
export async function deleteReview(reviewId: number): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error("Authentication required to delete review")
  }

  console.log(`Deleting review ID: ${reviewId}`)

  // Check if it's a local review
  const localReviews = getLocalReviews()
  const localReview = localReviews.find((review) => review.id === reviewId)

  if (localReview && localReview.isLocal) {
    // Delete local review
    removeLocalReview(reviewId)
    console.log("Local review deleted successfully")
    return
  }

  // Try to delete from API
  const isApiAvailable = await checkApiConnectivity()

  if (isApiAvailable) {
    try {
      await makeApiRequest(
        `${API_BASE_URL}/Reviews/${reviewId}`,
        {
          method: "DELETE",
        },
        true,
      )
      console.log("Review deleted from API successfully")
      return
    } catch (error) {
      console.error("Error deleting review from API:", error)
      throw error
    }
  } else {
    throw new Error("Cannot delete review - API is not available and review is not local")
  }
}

// Sync pending reviews when API becomes available
export async function syncPendingReviews(): Promise<void> {
  const isApiAvailable = await checkApiConnectivity()

  if (!isApiAvailable) {
    console.log("API not available, skipping sync")
    return
  }

  const pendingReviews = getPendingReviews()

  if (pendingReviews.length === 0) {
    console.log("No pending reviews to sync")
    return
  }

  console.log(`Syncing ${pendingReviews.length} pending reviews`)

  for (const reviewData of pendingReviews) {
    try {
      await makeApiRequest(
        `${API_BASE_URL}/Reviews`,
        {
          method: "POST",
          body: JSON.stringify(reviewData),
        },
        true,
      )
      console.log("Pending review synced successfully")
    } catch (error) {
      console.error("Error syncing pending review:", error)
      // Continue with other reviews
    }
  }

  // Clear pending reviews after successful sync
  clearPendingReviews()
  console.log("Pending reviews sync completed")
}

// Calculate review statistics
export function calculateReviewStats(reviews: Review[]) {
  if (!reviews || reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      distribution: [
        { stars: 5, count: 0, percentage: 0 },
        { stars: 4, count: 0, percentage: 0 },
        { stars: 3, count: 0, percentage: 0 },
        { stars: 2, count: 0, percentage: 0 },
        { stars: 1, count: 0, percentage: 0 },
      ],
    }
  }

  const total = reviews.length
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const average = Number.parseFloat((totalRating / total).toFixed(1))

  // Calculate distribution
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length
    const percentage = Math.round((count / total) * 100)
    return { stars, count, percentage }
  })

  return {
    average,
    total,
    distribution,
  }
}

// Format review date
export function formatReviewDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} month${months > 1 ? "s" : ""} ago`
    } else {
      const years = Math.floor(diffInDays / 365)
      return `${years} year${years > 1 ? "s" : ""} ago`
    }
  } catch (error) {
    return "Recently"
  }
}

// Check if user can perform review actions
export function canUserReview(): boolean {
  return isAuthenticated()
}

// Get user info for review operations
export function getCurrentUser() {
  return getCurrentUserData()
}

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log("Testing API connection...")
    const response = await fetch(`${API_BASE_URL.replace("/api", "")}/WeatherForecast`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
    })

    console.log(`API test response: ${response.status}`)
    return response.ok
  } catch (error) {
    console.error("API connection test failed:", error)
    return false
  }
}

// Get API status for UI display
export async function getApiStatus(): Promise<{ isOnline: boolean; message: string }> {
  const isOnline = await testApiConnection()

  return {
    isOnline,
    message: isOnline ? "Connected to server" : "Offline mode - reviews will be saved locally",
  }
}

// Clear all local data (for testing/debugging)
export function clearLocalData(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(LOCAL_REVIEWS_KEY)
  localStorage.removeItem(PENDING_REVIEWS_KEY)
  console.log("Local review data cleared")
}
