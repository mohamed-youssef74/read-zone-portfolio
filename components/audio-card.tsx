"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Star, Clock, BookmarkPlus, Heart, Download } from "lucide-react"
import {
  isBookmarked,
  isFavorite,
  isDownloaded,
  toggleBookmark,
  toggleFavorite,
  toggleDownload,
} from "@/services/audio-service"
import { toast } from "@/hooks/use-toast"

interface AudioCardProps {
  id: string
  title: string
  coverImage: string
  rating: number
  duration: string
  type: "audiobook" | "podcast"
  author?: string
  narrator?: string
  host?: string
}

export default function AudioCard({
  id,
  title,
  coverImage,
  rating,
  duration,
  type,
  author,
  narrator,
  host,
}: AudioCardProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (id) {
      setBookmarked(isBookmarked(id, type))
      setFavorited(isFavorite(id, type))
      setDownloaded(isDownloaded(id, type))
    }
  }, [id, type])

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const isNowBookmarked = toggleBookmark(id, type)
    setBookmarked(isNowBookmarked)
    toast({
      title: isNowBookmarked ? "تمت الإضافة للعلامات المرجعية" : "تمت الإزالة من العلامات المرجعية",
      description: isNowBookmarked
        ? `تمت إضافة ${title} إلى العلامات المرجعية`
        : `تمت إزالة ${title} من العلامات المرجعية`,
    })
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const isNowFavorite = toggleFavorite(id, type)
    setFavorited(isNowFavorite)
    toast({
      title: isNowFavorite ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة",
      description: isNowFavorite ? `تمت إضافة ${title} إلى المفضلة` : `تمت إزالة ${title} من المفضلة`,
    })
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const isNowDownloaded = toggleDownload(id, type)
    setDownloaded(isNowDownloaded)
    toast({
      title: isNowDownloaded ? "تم التنزيل" : "تمت إزالة التنزيل",
      description: isNowDownloaded ? `تم تنزيل ${title} للاستماع دون اتصال` : `تمت إزالة ${title} من التنزيلات`,
    })
  }

  return (
    <div className="book-card-container relative">
      <Link href={`/audio/${type}/${id}`} className="book-card">
        <div className="book-card-image-container">
          <Image
            src={coverImage || "/placeholder.svg"}
            alt={title}
            width={150}
            height={225}
            className="book-card-image"
          />
          <div className="book-card-actions absolute top-2 right-2 flex flex-col gap-2">
            <button
              className={`action-btn-small p-1 rounded-full bg-white/80 backdrop-blur-sm ${bookmarked ? "text-blue-500" : "text-gray-600"}`}
              onClick={handleBookmarkClick}
              aria-label="إضافة إلى العلامات المرجعية"
            >
              <BookmarkPlus size={16} />
            </button>
            <button
              className={`action-btn-small p-1 rounded-full bg-white/80 backdrop-blur-sm ${favorited ? "text-red-500" : "text-gray-600"}`}
              onClick={handleFavoriteClick}
              aria-label="إضافة إلى المفضلة"
            >
              <Heart size={16} />
            </button>
            <button
              className={`action-btn-small p-1 rounded-full bg-white/80 backdrop-blur-sm ${downloaded ? "text-green-500" : "text-gray-600"}`}
              onClick={handleDownloadClick}
              aria-label="تنزيل"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="book-info">
          <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
          {type === "audiobook" && author && <p className="book-author">{author}</p>}
          {type === "podcast" && host && <p className="book-author">Host: {host}</p>}
          <div className="flex justify-between items-center mt-1">
            <div className="book-rating">
              <Star size={14} />
              <span className="text-xs">{rating}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock size={12} className="mr-1" />
              <span>{duration}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
