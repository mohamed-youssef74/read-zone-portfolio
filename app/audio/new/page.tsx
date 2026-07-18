import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AudioCard from "@/components/audio-card"
import HeroSectionAudio from "@/components/hero-section-audio"
import { getAllAudiobooks } from "@/services/audio-service"

export default async function NewArrivalsPage() {
  // Get all audiobooks and sort by release date (newest first)
  const allAudiobooks = await getAllAudiobooks()
  const newArrivals = [...allAudiobooks].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
  )

  return (
    <main>
      <Navigation />
      <HeroSectionAudio />

      <div className="book-list-container">
        <h1 className="book-list-title">New Arrivals</h1>

        <div className="section">
          <div className="book-grid-full">
            {newArrivals.map((audiobook) => (
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
