"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Navigation from "@/components/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Send, Plus, MessageCircle, Trash2 } from "lucide-react"
import { chatService, type ChatMessage, type ChatSession } from "@/services/chat-service"
import { toast } from "sonner"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: string
  isLoading?: boolean
}

interface Chat {
  id: string
  messages: Message[]
}

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load existing sessions
    chatService.loadSessions()
    const loadedSessions = chatService.getSessions()
    setSessions(loadedSessions)

    // Create new session if none exists
    if (loadedSessions.length === 0) {
      createNewChat()
    } else {
      setCurrentSession(loadedSessions[0])
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const createNewChat = () => {
    const newSession = chatService.createNewSession()
    setSessions(chatService.getSessions())
    setCurrentSession(newSession)
    setSidebarOpen(false)
  }

  const selectSession = (session: ChatSession) => {
    setCurrentSession(session)
    setSidebarOpen(false)
  }

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    chatService.deleteSession(sessionId)
    const updatedSessions = chatService.getSessions()
    setSessions(updatedSessions)

    if (currentSession?.id === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSession(updatedSessions[0])
      } else {
        createNewChat()
      }
    }

    toast.success("تم حذف المحادثة")
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || !currentSession) return

    const userMessage: ChatMessage = {
      id: chatService.generateMessageId(),
      text: message.trim(),
      isUser: true,
      timestamp: chatService.formatTimestamp(),
    }

    // Add user message
    chatService.addMessageToSession(currentSession.id, userMessage)
    setCurrentSession({ ...currentSession, messages: [...currentSession.messages, userMessage] })
    setSessions(chatService.getSessions())

    const currentMessage = message
    setMessage("")
    setIsLoading(true)

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: chatService.generateMessageId(),
      text: "جاري الكتابة...",
      isUser: false,
      timestamp: chatService.formatTimestamp(),
      isLoading: true,
    }

    chatService.addMessageToSession(currentSession.id, loadingMessage)
    setCurrentSession((prev) => (prev ? { ...prev, messages: [...prev.messages, loadingMessage] } : null))

    try {
      // Send to API
      const botResponse = await chatService.sendMessage(currentMessage)

      // Replace loading message with actual response
      const botMessage: ChatMessage = {
        id: loadingMessage.id,
        text: botResponse,
        isUser: false,
        timestamp: chatService.formatTimestamp(),
        isLoading: false,
      }

      chatService.updateMessageInSession(currentSession.id, loadingMessage.id, botMessage)
      setCurrentSession((prev) => {
        if (!prev) return null
        const updatedMessages = prev.messages.map((msg) => (msg.id === loadingMessage.id ? botMessage : msg))
        return { ...prev, messages: updatedMessages }
      })
      setSessions(chatService.getSessions())
    } catch (error) {
      console.error("Chat error:", error)

      // Replace loading message with error message
      const errorMessage: ChatMessage = {
        id: loadingMessage.id,
        text: error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الرسالة",
        isUser: false,
        timestamp: chatService.formatTimestamp(),
        isLoading: false,
      }

      chatService.updateMessageInSession(currentSession.id, loadingMessage.id, errorMessage)
      setCurrentSession((prev) => {
        if (!prev) return null
        const updatedMessages = prev.messages.map((msg) => (msg.id === loadingMessage.id ? errorMessage : msg))
        return { ...prev, messages: updatedMessages }
      })

      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الرسالة")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div
          className={`w-80 border-r bg-card transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:relative lg:translate-x-0 z-10 h-full`}
        >
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/robot-RSDbEHoCFiR3xIBvBmMP3ODu3vRyET.png"
                alt="ChatRZ"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <h2 className="font-semibold">ChatRZ</h2>
                <span className="text-sm text-green-500">• متصل</span>
              </div>
            </div>

            <Button onClick={createNewChat} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              محادثة جديدة
            </Button>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-120px)]">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">المحادثات السابقة</h3>
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`cursor-pointer transition-colors hover:bg-accent group ${
                  currentSession?.id === session.id ? "bg-accent" : ""
                }`}
                onClick={() => selectSession(session)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => deleteSession(session.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MessageCircle className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">ChatRZ</h1>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/robot-RSDbEHoCFiR3xIBvBmMP3ODu3vRyET.png"
                  alt="ChatRZ"
                  width={120}
                  height={120}
                  className="mb-6 opacity-50"
                />
                <h2 className="text-2xl font-semibold mb-2">مرحباً بك في ChatRZ</h2>
                <p className="text-muted-foreground mb-6">كيف يمكنني مساعدتك اليوم؟</p>
              </div>
            ) : (
              <>
                {currentSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] ${msg.isUser ? "order-2" : "order-1"}`}>
                      <Card className={`${msg.isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            {!msg.isUser && (
                              <Image
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/robot-RSDbEHoCFiR3xIBvBmMP3ODu3vRyET.png"
                                alt="Bot"
                                width={24}
                                height={24}
                                className="rounded-full flex-shrink-0 mt-1"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.isLoading ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {msg.text}
                                  </span>
                                ) : (
                                  msg.text
                                )}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}
                              >
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك هنا..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!message.trim() || isLoading} size="icon">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-5 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}
