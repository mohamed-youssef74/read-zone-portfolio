import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AudioCard from "@/components/audio-card"
import HeroSectionAudio from "@/components/hero-section-audio"
import Link from "next/link"
import { getAllAudiobooks, getAllPodcasts } from "@/services/audio-service"

export default async function AudioEducationPage() {
  // Get all audiobooks and podcasts and filter for education category
  const allAudiobooks = await getAllAudiobooks()
  const allPodcasts = getAllPodcasts()

  const educationAudiobooks = allAudiobooks.filter((audiobook) =>
    audiobook.categories.some(
      (cat) =>
        cat.toLowerCase() === "education" ||
        cat.toLowerCase() === "educational" ||
        cat.toLowerCase() === "learning",
    ),
  )

  const educationPodcasts = allPodcasts.filter((podcast) =>
    podcast.categories.some(
      (cat) =>
        cat.toLowerCase() === "education" ||
        cat.toLowerCase() === "language" ||
        cat.toLowerCase() === "learning",
    ),
  )

  // Combine audiobooks and podcasts
  const audioItems = [
    ...educationAudiobooks.map((item) => ({
      ...item,
      type: "audiobook" as const,
    })),
    ...educationPodcasts.map((item) => ({
      ...item,
      type: "podcast" as const,
    })),
  ]

  return (
    <main>
      <Navigation />
      <HeroSectionAudio />

      <div className="categories">
        <Link href="/audio/novel" className="category">
          Novel
        </Link>
        <Link href="/audio/science" className="category">
          Science
        </Link>
        <Link href="/audio/romance" className="category">
          Romance
        </Link>
        <Link href="/audio/crime" className="category">
          Crime
        </Link>
        <Link href="/audio/education" className="category active">
          Education
        </Link>
        <Link href="/audio/psychology" className="category">
          Psychology
        </Link>
        <Link href="/audio/history" className="category">
          History
        </Link>
      </div>

      <div className="book-list-container">
        <h1 className="book-list-title">Education Audiobooks & Podcasts</h1>

        <div className="section">
          <div className="book-grid-full">
            {audioItems.map((item) => (
              <AudioCard
                key={item.id}
                id={item.id}
                title={item.title}
                coverImage={item.coverImage}
                rating={item.rating}
                duration={item.duration}
                type={item.type}
                author={item.type === "audiobook" ? item.author : undefined}
                narrator={item.type === "audiobook" ? item.narrator : undefined}
                host={item.type === "podcast" ? item.host : undefined}
              />
            ))}

            {audioItems.length === 0 && (
              <div className="col-span-full text-center py-10">
                <p>No education audio content found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}