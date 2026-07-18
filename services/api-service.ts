// Base API URL
const API_BASE_URL = "https://myfirstapi.runasp.net/api"
const STORAGE_BASE_URL = "https://myfirstapi.runasp.net" // Base URL للـ storage

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API error: ${response.status}`)
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null
  }

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  return response.text()
}

// Helper function to construct full image URL
function getFullImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "/placeholder.svg?height=150&width=150"

  // إذا كان المسار يبدأ بـ http أو https، فهو مسار كامل
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }

  // إذا كان المسار يبدأ بـ /، فهو مسار نسبي من الجذر
  if (imagePath.startsWith("/")) {
    return `${STORAGE_BASE_URL}${imagePath}`
  }

  // إذا كان اسم ملف فقط، نضيف المسار الافتراضي
  return `${STORAGE_BASE_URL}/uploads/profile-images/${imagePath}`
}

// Function to get auth headers
function getAuthHeaders() {
  // Server Side Rendering
  if (typeof window === "undefined") {
    return {
      "Content-Type": "application/json",
    }
  }

  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Function to get multipart headers for file uploads
function getMultipartHeaders() {
  if (typeof window === "undefined") {
    return {}
  }

  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Auth API functions
export const authApi = {
  // Register a new user
  register: async (userData: {
    username: string
    email: string
    password: string
    profileImageUrl?: string
    birthDate: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/Auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    return handleResponse(response)
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    return handleResponse(response)
  },

  // Logout user
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/Auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
    return response.ok
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    return handleResponse(response)
  },

  // Verify OTP
  verifyOtp: async (data: { email: string; otp: string }) => {
    const response = await fetch(`${API_BASE_URL}/Auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // Reset password
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // Refresh token
  refreshToken: async (email: string, refreshToken: string) => {
    const response = await fetch(
      `${API_BASE_URL}/Auth/refreshToken?email=${encodeURIComponent(email)}&refreshToken=${encodeURIComponent(refreshToken)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    )
    return handleResponse(response)
  },

  // Revoke token
  revokeToken: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/Auth/revokeToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email),
    })
    const result = await handleResponse(response)
    return result === "Revoked"
  },

  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/Auth/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    })
    const profile = await handleResponse(response)

    // تحويل مسار الصورة إلى URL كامل
    if (profile && profile.profileImageUrl) {
      profile.profileImageUrl = getFullImageUrl(profile.profileImageUrl)
    }

    return profile
  },

  // Update username and profile
  updateUsername: async (data: { username: string }) => {
    const response = await fetch(`${API_BASE_URL}/Auth/update-username`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // Upload profile image (POST) - for new profile images
  uploadProfileImage: async (imageFile: File) => {
    const formData = new FormData()
    formData.append("Image", imageFile)

    const response = await fetch(`${API_BASE_URL}/Auth/upload-profile-image`, {
      method: "POST",
      headers: getMultipartHeaders(),
      body: formData,
    })

    const result = await handleResponse(response)

    // تحويل مسار الصورة إلى URL كامل
    if (result && result.imageUrl) {
      result.imageUrl = getFullImageUrl(result.imageUrl)
    }

    return result
  },

  // Update profile image (PUT) - for updating existing profile images
  updateProfileImage: async (imageFile: File) => {
    const formData = new FormData()
    formData.append("Image", imageFile)

    const response = await fetch(`${API_BASE_URL}/Auth/update-profile-image`, {
      method: "PUT",
      headers: getMultipartHeaders(),
      body: formData,
    })

    const result = await handleResponse(response)

    // تحويل مسار الصورة إلى URL كامل
    if (result && result.imageUrl) {
      result.imageUrl = getFullImageUrl(result.imageUrl)
    }

    return result
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await fetch(`${API_BASE_URL}/Auth/change-password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // Delete account
  deleteAccount: async () => {
    const response = await fetch(`${API_BASE_URL}/Auth/delete-account`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    const result = await handleResponse(response)
    return result === "Account deleted"
  },
}

// Books API functions
export const booksApi = {
  // Get new books
  getNewBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/Books/new`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get grouped books
  getGroupedBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/Books/grouped`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get popular books
  getPopularBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/Books/popular`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Search books
  searchBooks: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/Books/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get book details
  getBookDetails: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Books/details/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get book content
  getBookContent: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Books/${id}/content`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Book Sections API functions
export const bookSectionsApi = {
  getFictionBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/fiction`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getChildrenBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/children`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getScienceBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/science`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getFantasyBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/fantasy`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getRomanceBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/romance`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getHistoryBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/history`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getAdventureBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/adventure`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getPhilosophyBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/philosophy`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getDramaBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/drama`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getMysteryBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/books/sections/mystery`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// AudioBooks API functions
export const audioBooksApi = {
  // Get home audiobooks
  getHomeAudioBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/AudioBooks/home`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Search audiobooks
  searchAudioBooks: async (keyword = "") => {
    const response = await fetch(`${API_BASE_URL}/AudioBooks/search?keyword=${encodeURIComponent(keyword)}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get audiobook by identifier
  getAudioBookById: async (identifier: string) => {
    const response = await fetch(`${API_BASE_URL}/AudioBooks/${encodeURIComponent(identifier)}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Store API functions
export const storeApi = {
  // Get top sellers
  getTopSellers: async () => {
    const response = await fetch(`${API_BASE_URL}/Store/topsellers`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get new arrivals
  getNewArrivals: async () => {
    const response = await fetch(`${API_BASE_URL}/Store/newarrivals`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get special offers
  getSpecialOffers: async () => {
    const response = await fetch(`${API_BASE_URL}/Store/specialoffers`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get book by ID
  getBookById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Store/book/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// User Library API functions
export const userLibraryApi = {
  // === FAVORITES ===
  addToFavorites: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/favorites/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ externalBookId }),
    })
    return handleResponse(response)
  },

  removeFromFavorites: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/favorites/delete/${externalBookId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getFavorites: async () => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/favorites`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // === BOOKMARKS ===
  addToBookmarks: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/bookmarks/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ externalBookId }),
    })
    return handleResponse(response)
  },

  removeFromBookmarks: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/bookmarks/delete/${externalBookId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getBookmarks: async () => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/bookmarks`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // === DOWNLOADS ===
  addToDownloads: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/downloads/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ externalBookId }),
    })
    return handleResponse(response)
  },

  removeFromDownloads: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/downloads/delete/${externalBookId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getDownloads: async () => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/downloads`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // === AUDIOBOOKS RECENT ===
  addToRecentAudioBooks: async (identifier: string) => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/audiobooks/recent/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifier }),
    })
    return handleResponse(response)
  },

  getRecentAudioBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/UserLibrary/audiobooks/recent`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Notes API functions
export const notesApi = {
  getNotes: async () => {
    const response = await fetch(`${API_BASE_URL}/Notes`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  createNote: async (noteData: { title: string; content: string }) => {
    const response = await fetch(`${API_BASE_URL}/Notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    })
    return handleResponse(response)
  },

  getNoteById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Notes/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  updateNote: async (id: number, noteData: { title?: string; content?: string }) => {
    const response = await fetch(`${API_BASE_URL}/Notes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    })
    return handleResponse(response)
  },

  deleteNote: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return response.ok
  },
}

// Reviews API functions
export const reviewsApi = {
  addReview: async (reviewData: { bookExternalId: number; rating: number; feedback?: string }) => {
    const response = await fetch(`${API_BASE_URL}/Reviews`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    })
    return handleResponse(response)
  },

  getBookReviews: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/Reviews/book/${externalBookId}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  deleteReview: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Reviews/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return response.ok
  },
}

// Orders API functions
export const ordersApi = {
  placeOrder: async (orderData: {
    bookId: number
    deliveryMethod: string
    paymentMethod: string
    promoCode?: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/Orders/place`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    })
    return handleResponse(response)
  },
}

// Timeline API functions (Social Features)
export const timelineApi = {
  // Create post
  createPost: async (content: string, image?: File) => {
    const formData = new FormData()
    formData.append("Content", content)
    if (image) {
      formData.append("Image", image)
    }

    const response = await fetch(`${API_BASE_URL}/Timeline`, {
      method: "POST",
      headers: getMultipartHeaders(),
      body: formData,
    })
    return handleResponse(response)
  },

  // Get timeline
  getTimeline: async () => {
    const response = await fetch(`${API_BASE_URL}/Timeline`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Delete post
  deletePost: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return response.ok
  },

  // Like post
  likePost: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/like`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ postId }),
    })
    return handleResponse(response)
  },

  // Unlike post
  unlikePost: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/like`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ postId }),
    })
    return handleResponse(response)
  },

  // Get post likes
  getPostLikes: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/${postId}/likes`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get like count
  getLikeCount: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/${postId}/like-count`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get comment count
  getCommentCount: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/${postId}/comment-count`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Add comment
  addComment: async (postId: number, text: string) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ postId, text }),
    })
    return handleResponse(response)
  },

  // Get comments
  getComments: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/get/${postId}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Delete comment
  deleteComment: async (commentId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/delete`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ commentId }),
    })
    return handleResponse(response)
  },

  // Get my posts
  getMyPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/Timeline/my-posts`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get notifications
  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/Timeline/notifications`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/notifications/${notificationId}/read`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Add to favorites
  addToFavorites: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/favorites/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ postId }),
    })
    return handleResponse(response)
  },

  // Get favorite posts
  getFavoritePosts: async () => {
    const response = await fetch(`${API_BASE_URL}/Timeline/favorites/list`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Remove from favorites
  removeFromFavorites: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/Timeline/favorites/remove`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ postId }),
    })
    return handleResponse(response)
  },
}

// Chat API functions
export const chatApi = {
  sendMessage: async (messageData: { message: string }) => {
    const response = await fetch(`${API_BASE_URL}/chat/send`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    })
    return handleResponse(response)
  },
}

// Recommendations API functions
export const recommendationsApi = {
  // Get similar books by title
  getSimilarBooks: async (title: string) => {
    const response = await fetch(`${API_BASE_URL}/Recommendations/similar?title=${encodeURIComponent(title)}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// OfflineBooks API functions
export const offlineBooksApi = {
  downloadBook: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/OfflineBooks/download`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(externalBookId),
    })
    return handleResponse(response)
  },

  getOfflineBook: async (externalBookId: number) => {
    const response = await fetch(`${API_BASE_URL}/OfflineBooks/${externalBookId}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  getAllOfflineBooks: async () => {
    const response = await fetch(`${API_BASE_URL}/OfflineBooks/all`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Weather API (for testing)
export const weatherApi = {
  getWeatherForecast: async () => {
    const response = await fetch(`${API_BASE_URL}/../WeatherForecast`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}

// Export helper function for use in other components
export { getFullImageUrl }
