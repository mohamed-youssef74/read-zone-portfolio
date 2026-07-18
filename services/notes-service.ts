import { notesApi } from "./api-service"

// Types based on the API schema
export interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt?: string
  userId: number
  user?: any
}

export interface NoteDto {
  id: number
  title: string
  content: string
  createdAt: string
}

export interface CreateNoteDto {
  title: string
  content: string
}

export interface UpdateNoteDto {
  title?: string
  content?: string
}

// Get all notes - Always fetch from API
export async function getAllNotes(): Promise<NoteDto[]> {
  try {
    console.log("Fetching notes from API...")
    const notes = await notesApi.getNotes()
    return Array.isArray(notes) ? notes : []
  } catch (error) {
    console.error("Error fetching notes:", error)
    return []
  }
}

// Get note by ID - Always fetch from API
export async function getNoteById(id: number): Promise<NoteDto | null> {
  try {
    console.log(`Fetching note ${id} from API...`)
    const note = await notesApi.getNoteById(id)
    return note || null
  } catch (error) {
    console.error(`Error fetching note ${id}:`, error)
    return null
  }
}

// Create new note
export async function createNote(noteData: CreateNoteDto): Promise<NoteDto | null> {
  try {
    console.log("Creating note:", noteData)
    const newNote = await notesApi.createNote(noteData)
    return newNote
  } catch (error) {
    console.error("Error creating note:", error)
    throw new Error("Failed to create note. Please try again.")
  }
}

// Update note
export async function updateNote(id: number, noteData: UpdateNoteDto): Promise<boolean> {
  try {
    console.log(`Updating note ${id}:`, noteData)
    await notesApi.updateNote(id, noteData)
    return true
  } catch (error) {
    console.error(`Error updating note ${id}:`, error)
    throw new Error("Failed to update note. Please try again.")
  }
}

// Delete note
export async function deleteNote(id: number): Promise<boolean> {
  try {
    console.log(`Deleting note ${id}`)
    const success = await notesApi.deleteNote(id)
    return success
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error)
    throw new Error("Failed to delete note. Please try again.")
  }
}

// Search notes - Client-side search since API doesn't have search endpoint
export function searchNotes(notes: NoteDto[], query: string): NoteDto[] {
  if (!query.trim()) return notes

  const searchTerm = query.toLowerCase()
  return notes.filter(
    (note) => note.title.toLowerCase().includes(searchTerm) || note.content.toLowerCase().includes(searchTerm),
  )
}

// Sort notes by different criteria
export function sortNotes(notes: NoteDto[], sortBy: "newest" | "oldest" | "title"): NoteDto[] {
  const sortedNotes = [...notes]

  switch (sortBy) {
    case "newest":
      return sortedNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case "oldest":
      return sortedNotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    case "title":
      return sortedNotes.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return sortedNotes
  }
}

// Format date for display
export function formatNoteDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24)
      return `${days} day${days > 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Unknown date"
  }
}

// Get notes statistics
export function getNotesStats(notes: NoteDto[]) {
  const totalNotes = notes.length
  const totalWords = notes.reduce((sum, note) => {
    const wordCount = note.content.split(/\s+/).filter((word) => word.length > 0).length
    return sum + wordCount
  }, 0)

  const recentNotes = notes.filter((note) => {
    const noteDate = new Date(note.createdAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return noteDate > weekAgo
  }).length

  return {
    totalNotes,
    totalWords,
    recentNotes,
    averageWordsPerNote: totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
  }
}
