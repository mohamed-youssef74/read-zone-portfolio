"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  audioSrc: string
  title: string
  author?: string
  host?: string
  chapters?: { id: string; title: string; duration: string; startTime: number }[]
}

export default function AudioPlayer({ audioSrc, title, author, host, chapters }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [activeChapter, setActiveChapter] = useState(chapters?.[0]?.id || "")
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const updateChapter = () => {
      if (!chapters) return
      const currentChapter = chapters.find(
        (chapter, index) =>
          audio.currentTime >= chapter.startTime &&
          (index === chapters.length - 1 || audio.currentTime < chapters[index + 1].startTime),
      )
      if (currentChapter) setActiveChapter(currentChapter.id)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("timeupdate", updateChapter)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("timeupdate", updateChapter)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [chapters])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Number.parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = Number.parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(duration, audio.currentTime + 10)
  }

  const jumpToChapter = (startTime: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = startTime
    if (!isPlaying) togglePlay()
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX />
    if (volume < 0.5) return <Volume1 />
    return <Volume2 />
  }

  return (
    <div className="player-container">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      <div className="player-header">
        <h3>{title}</h3>
        <p className="author">{author || host}</p>
      </div>

      <div className="audio-progress">
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleProgressChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="player-controls">
        <button className="control-button" onClick={skipBackward}>
          <SkipBack />
        </button>
        <button className="control-button play-button" onClick={togglePlay}>
          {isPlaying ? <Pause /> : <Play />}
        </button>
        <button className="control-button" onClick={skipForward}>
          <SkipForward />
        </button>
      </div>

      <div className="volume-control">
        <button className="control-button">{getVolumeIcon()}</button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>

      {chapters && chapters.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 font-semibold">Chapters</h4>
          <div className="chapters-list">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`chapter ${activeChapter === chapter.id ? "active" : ""}`}
                onClick={() => jumpToChapter(chapter.startTime)}
              >
                <span>{chapter.title}</span>
                <span>{chapter.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
