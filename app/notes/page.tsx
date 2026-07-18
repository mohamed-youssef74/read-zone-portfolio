"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  sortNotes,
  formatNoteDate,
  getNotesStats,
  type NoteDto,
} from "@/services/notes-service"
import { Plus, Search, Edit, Trash2, FileText, Clock, TrendingUp } from "lucide-react"

export default function NotesPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  const [notes, setNotes] = useState<NoteDto[]>([])
  const [filteredNotes, setFilteredNotes] = useState<NoteDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest")

  // Create/Edit note state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteDto | null>(null)
  const [noteForm, setNoteForm] = useState({ title: "", content: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }
  }, [isLoggedIn, router])

  // Fetch notes
  useEffect(() => {
    if (!isLoggedIn) return

    const fetchNotes = async () => {
      try {
        setLoading(true)
        const fetchedNotes = await getAllNotes()
        setNotes(fetchedNotes)
      } catch (error) {
        console.error("Error fetching notes:", error)
        toast({
          title: "Error",
          description: "Failed to load notes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [isLoggedIn])

  // Filter and sort notes
  useEffect(() => {
    let result = searchNotes(notes, searchQuery)
    result = sortNotes(result, sortBy)
    setFilteredNotes(result)
  }, [notes, searchQuery, sortBy])

  const handleCreateNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const newNote = await createNote({
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
      })

      if (newNote) {
        // Refresh notes list
        const updatedNotes = await getAllNotes()
        setNotes(updatedNotes)

        setNoteForm({ title: "", content: "" })
        setIsCreateDialogOpen(false)

        toast({
          title: "Success",
          description: "Note created successfully!",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create note.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditNote = async () => {
    if (!editingNote || !noteForm.title.trim() || !noteForm.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const success = await updateNote(editingNote.id, {
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
      })

      if (success) {
        // Refresh notes list
        const updatedNotes = await getAllNotes()
        setNotes(updatedNotes)

        setNoteForm({ title: "", content: "" })
        setEditingNote(null)
        setIsEditDialogOpen(false)

        toast({
          title: "Success",
          description: "Note updated successfully!",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update note.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      const success = await deleteNote(noteId)

      if (success) {
        // Refresh notes list
        const updatedNotes = await getAllNotes()
        setNotes(updatedNotes)

        toast({
          title: "Success",
          description: "Note deleted successfully!",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete note.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (note: NoteDto) => {
    setEditingNote(note)
    setNoteForm({ title: note.title, content: note.content })
    setIsEditDialogOpen(true)
  }

  const stats = getNotesStats(notes)

  if (!isLoggedIn) {
    return null // Will redirect
  }

  return (
    <main>
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Notes</h1>
          <p className="text-muted-foreground">Organize your thoughts and ideas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Notes</p>
                  <p className="text-2xl font-bold">{stats.totalNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Words</p>
                  <p className="text-2xl font-bold">{stats.totalWords}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.recentNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Words</p>
                  <p className="text-2xl font-bold">{stats.averageWordsPerNote}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Note title..."
                  value={noteForm.title}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Write your note content here..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={10}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNote} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Note"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(note)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {formatNoteDate(note.createdAt)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-4">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{searchQuery ? "No notes found" : "No notes yet"}</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try adjusting your search terms" : "Create your first note to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Button>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Note title..."
                value={noteForm.title}
                onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Write your note content here..."
                value={noteForm.content}
                onChange={(e) => setNoteForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={10}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditNote} disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Note"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </main>
  )
}
