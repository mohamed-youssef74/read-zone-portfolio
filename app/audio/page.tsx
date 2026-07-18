import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { getAllAudiobooks } from "@/services/audio-service"
import AudioCard from "@/components/audio-card"
import HeroSectionAudio from "@/components/hero-section-audio"
import SearchForm from "@/components/search-form"

export default async function AudioPage() {
  // Get all audiobooks from API
  const allAudiobooks = await getAllAudiobooks()

  // Filter for different sections
  const popularAudiobooks = allAudiobooks.slice(0, 7)
  const newAudiobooks = allAudiobooks.slice(0, 7).reverse()

  return (
    <main>
      <Navigation />
      <HeroSectionAudio />

      <SearchForm />

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Link href="/audio/popular">Popular Audiobooks</Link>
          </h2>
          <Link href="/audio/popular" className="see-all">
            See All ›
          </Link>
        </div>
        <div className="book-grid">
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
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">New Arrivals</h2>
          <Link href="/audio/new" className="see-all">
            See All ›
          </Link>
        </div>
        <div className="book-grid">
          {newAudiobooks.map((audiobook) => (
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
      </section>

      <Footer />
    </main>
  )
}
