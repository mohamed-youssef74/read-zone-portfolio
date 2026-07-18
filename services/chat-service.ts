import { chatApi } from "./api-service"
import {
  searchBooks,
  getBooksBySection,
  BOOK_SECTIONS,
  getPopularBooks,
  getNewBooks,
  type Book,
  type BookSection,
} from "./book-service"

export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: string
  isLoading?: boolean
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  title: string
  createdAt: string
}

class ChatService {
  private sessions: ChatSession[] = []

  // Send message to API and get response
  async sendMessage(message: string): Promise<string> {
    try {
      console.log("Sending message:", message)

      // Always check for book queries first
      if (isBookQuery(message)) {
        console.log("Processing book query...")
        return await searchBooksFromQuery(message)
      }

      // Try to send to chat API
      try {
        const response = await chatApi.sendMessage({ message })
        console.log("API Response:", response)

        if (typeof response === "string") {
          return response
        }

        if (response && typeof response === "object") {
          return response.message || response.response || response.text || "تم استلام ردك بنجاح"
        }

        return "تم استلام رسالتك بنجاح"
      } catch (apiError) {
        console.log("API failed, providing general response")
        return "أهلاً بك! يمكنني مساعدتك في العثور على الكتب. اسأل عن الكتب الشائعة، الجديدة، أو أي قسم معين."
      }
    } catch (error) {
      console.error("Chat service error:", error)
      return "عذراً، حدث خطأ. يمكنك المحاولة مرة أخرى أو تصفح الكتب مباشرة."
    }
  }

  // Create new chat session
  createNewSession(): ChatSession {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      messages: [],
      title: `محادثة ${new Date().toLocaleDateString("ar-EG")}`,
      createdAt: new Date().toISOString(),
    }

    this.sessions.unshift(newSession)
    this.saveSessions()
    return newSession
  }

  // Get all sessions
  getSessions(): ChatSession[] {
    return this.sessions
  }

  // Get session by ID
  getSession(id: string): ChatSession | undefined {
    return this.sessions.find((session) => session.id === id)
  }

  // Add message to session
  addMessageToSession(sessionId: string, message: ChatMessage): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.messages.push(message)
      this.saveSessions()
    }
  }

  // Update message in session
  updateMessageInSession(sessionId: string, messageId: string, updates: Partial<ChatMessage>): void {
    const session = this.getSession(sessionId)
    if (session) {
      const messageIndex = session.messages.findIndex((msg) => msg.id === messageId)
      if (messageIndex !== -1) {
        session.messages[messageIndex] = { ...session.messages[messageIndex], ...updates }
        this.saveSessions()
      }
    }
  }

  // Delete session
  deleteSession(id: string): void {
    this.sessions = this.sessions.filter((session) => session.id !== id)
    this.saveSessions()
  }

  // Load sessions from localStorage
  loadSessions(): void {
    try {
      const saved = localStorage.getItem("chat-sessions")
      if (saved) {
        this.sessions = JSON.parse(saved)
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error)
      this.sessions = []
    }
  }

  // Save sessions to localStorage
  private saveSessions(): void {
    try {
      localStorage.setItem("chat-sessions", JSON.stringify(this.sessions))
    } catch (error) {
      console.error("Error saving chat sessions:", error)
    }
  }

  // Generate message ID
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Format timestamp
  formatTimestamp(): string {
    return new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }
}

// Helper function to detect if user is asking about books
function isBookQuery(message: string): boolean {
  const bookKeywords = [
    "كتاب",
    "كتب",
    "قصة",
    "قصص",
    "رواية",
    "روايات",
    "مؤلف",
    "كاتب",
    "أدب",
    "شعر",
    "تاريخ",
    "علوم",
    "فلسفة",
    "جريمة",
    "رومانسي",
    "خيال",
    "مغامرة",
    "أطفال",
    "دراما",
    "غموض",
    "قراءة",
    "اقرأ",
    "بحث",
    "ابحث",
    "رشح",
    "اقترح",
    "أريد",
    "عايز",
    "book",
    "books",
    "novel",
    "story",
    "author",
    "fiction",
    "romance",
    "history",
    "science",
    "philosophy",
    "crime",
    "adventure",
    "mystery",
    "read",
    "recommend",
  ]

  const lowerMessage = message.toLowerCase()
  return bookKeywords.some((keyword) => lowerMessage.includes(keyword))
}

// Helper function to search for books based on user query
async function searchBooksFromQuery(message: string): Promise<string> {
  try {
    const lowerMessage = message.toLowerCase()

    // Check for popular books
    if (lowerMessage.includes("شائع") || lowerMessage.includes("مشهور") || lowerMessage.includes("popular")) {
      try {
        const books = await getPopularBooks()
        return formatBooksResponse(books, "من الكتب الشائعة")
      } catch (error) {
        return "عذراً، لا أستطيع الوصول للكتب الشائعة حالياً. جرب البحث في الأقسام المختلفة."
      }
    }

    // Check for new books
    if (lowerMessage.includes("جديد") || lowerMessage.includes("حديث") || lowerMessage.includes("new")) {
      try {
        const books = await getNewBooks()
        return formatBooksResponse(books, "من الكتب الجديدة")
      } catch (error) {
        return "عذراً، لا أستطيع الوصول للكتب الجديدة حالياً. جرب البحث في الأقسام المختلفة."
      }
    }

    // Check for specific sections
    const section = detectBookSection(message)
    if (section) {
      try {
        const books = await getBooksBySection(section)
        const sectionName = getSectionNameInArabic(section)
        return formatBooksResponse(books, `من كتب ${sectionName}`)
      } catch (error) {
        return `عذراً، لا أستطيع الوصول لكتب ${getSectionNameInArabic(section)} حالياً.`
      }
    }

    // Try to search by terms
    const searchTerms = extractSearchTerms(message)
    if (searchTerms) {
      try {
        const books = await searchBooks(searchTerms)
        if (books && books.length > 0) {
          return formatBooksResponse(books, `المطابقة لبحثك "${searchTerms}"`)
        }
      } catch (error) {
        console.log("Search failed:", error)
      }
    }

    // Default response
    return getDefaultBookResponse()
  } catch (error) {
    console.error("Error in searchBooksFromQuery:", error)
    return "عذراً، حدث خطأ أثناء البحث. يمكنك تصفح الكتب مباشرة من الصفحة الرئيسية."
  }
}

// Helper function to get default book response
function getDefaultBookResponse(): string {
  return `مرحباً! يمكنني مساعدتك في العثور على الكتب. يمكنك السؤال عن:

📚 **الكتب الشائعة** - اكتب "كتب شائعة"
🆕 **الكتب الجديدة** - اكتب "كتب جديدة"
📖 **أقسام الكتب**:
   • الخيال والروايات
   • الرومانسية
   • التاريخ
   • العلوم
   • الفلسفة
   • المغامرة
   • الغموض والجريمة

أو ابحث عن كتاب معين بكتابة اسمه أو اسم المؤلف.`
}

// Helper function to detect book section
function detectBookSection(message: string): BookSection | null {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("خيال") || lowerMessage.includes("fiction")) {
    return BOOK_SECTIONS.FICTION
  }
  if (lowerMessage.includes("رومانس") || lowerMessage.includes("حب") || lowerMessage.includes("romance")) {
    return BOOK_SECTIONS.ROMANCE
  }
  if (lowerMessage.includes("تاريخ") || lowerMessage.includes("history")) {
    return BOOK_SECTIONS.HISTORY
  }
  if (lowerMessage.includes("مغامرة") || lowerMessage.includes("adventure")) {
    return BOOK_SECTIONS.ADVENTURE
  }
  if (lowerMessage.includes("فلسفة") || lowerMessage.includes("philosophy")) {
    return BOOK_SECTIONS.PHILOSOPHY
  }
  if (
    lowerMessage.includes("غموض") ||
    lowerMessage.includes("جريمة") ||
    lowerMessage.includes("mystery") ||
    lowerMessage.includes("crime")
  ) {
    return BOOK_SECTIONS.MYSTERY
  }
  if (lowerMessage.includes("علوم") || lowerMessage.includes("علمي") || lowerMessage.includes("science")) {
    return BOOK_SECTIONS.SCIENCE
  }
  if (lowerMessage.includes("فانتازيا") || lowerMessage.includes("fantasy")) {
    return BOOK_SECTIONS.FANTASY
  }

  return null
}

// Helper function to format books response
function formatBooksResponse(books: Book[], queryType: string): string {
  if (!books || books.length === 0) {
    return `عذراً، لا توجد كتب ${queryType} متاحة حالياً.`
  }

  // Filter valid books
  const validBooks = books.filter((book) => book && book.title && book.title.trim() !== "").slice(0, 6) // Limit to 6 books

  if (validBooks.length === 0) {
    return `عذراً، لا توجد كتب صالحة ${queryType} حالياً.`
  }

  let response = `📚 وجدت ${validBooks.length} كتاب ${queryType}:\n\n`

  validBooks.forEach((book, index) => {
    const authors =
      book.authors && book.authors.length > 0
        ? book.authors
            .map((author) => author.name)
            .filter((name) => name)
            .join(", ")
        : "غير محدد"

    response += `${index + 1}. **${book.title}**\n`
    response += `   👤 المؤلف: ${authors}\n`

    if (book.subjects && book.subjects.length > 0) {
      const subjects = book.subjects.filter((s) => s && s.trim() !== "").slice(0, 2)
      if (subjects.length > 0) {
        response += `   🏷️ التصنيف: ${subjects.join(", ")}\n`
      }
    }

    response += "\n"
  })

  response += "يمكنك البحث عن أي من هذه الكتب في الموقع باستخدام العنوان."

  return response
}

// Helper function to get section name in Arabic
function getSectionNameInArabic(section: BookSection): string {
  const sectionNames: Record<string, string> = {
    fiction: "الخيال",
    romance: "الرومانسية",
    history: "التاريخ",
    adventure: "المغامرة",
    philosophy: "الفلسفة",
    mystery: "الغموض",
    science: "العلوم",
    fantasy: "الفانتازيا",
    children: "الأطفال",
    drama: "الدراما",
  }

  return sectionNames[section] || section
}

// Helper function to extract search terms
function extractSearchTerms(message: string): string | null {
  const cleanMessage = message
    .replace(/ما هي|ما هو|أين|كيف|متى|لماذا|هل|أريد|أبحث عن|ابحث عن|عن|كتاب|كتب|رواية|روايات|قصة|قصص|مؤلف|كاتب/gi, "")
    .trim()

  return cleanMessage.length > 2 ? cleanMessage : null
}

export const chatService = new ChatService()
