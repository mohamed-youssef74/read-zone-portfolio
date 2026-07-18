import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AudioCard from "@/components/audio-card"
import HeroSectionAudio from "@/components/hero-section-audio"
import { getAllAudiobooks } from "@/services/audio-service"

export default async function PopularAudiobooksPage() {
  // Get all audiobooks and sort by rating (highest first)
  const allAudiobooks = await getAllAudiobooks()
  const popularAudiobooks = [...allAudiobooks].sort((a, b) => b.rating - a.rating)

  return (
    <main>
      <Navigation />
      <HeroSectionAudio />

      <div className="book-list-container">
        <h1 className="book-list-title">Popular Audiobooks</h1>

        <div className="section">
          <div className="book-grid-full">
            {popularAudiobooks.map((audiobook) => (
              <AudioCard
                key={audiobook.id}
                id={audiobook.id}
                title={audiobook.title}
                coverImage={audiobook.coverImage}
                rating={audiobook.rating}
                duration={audiobook.duration}
                type="audiobook"
                author={audiobook.author}
                narrator={audiobook.narrator}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
