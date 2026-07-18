import Image from "next/image"
import Link from "next/link"

export default function HeroSectionAudio() {
  return (
    <div className="hero">
      <div className="hero-content">
        <h1>
          Listen to the Best <span>Audiobooks</span>
        </h1>
        <p>
          Enjoy a wide range of audiobooks in various fields. Listen while driving, exercising, or anytime that suits
          you.
        </p>
        <div className="flex gap-4">
          <Link href="/audio/audiobooks" className="btn btn-signup">
            Explore Audiobooks
          </Link>
          <Link href="/audio/new" className="btn btn-login">
            New Arrivals
          </Link>
        </div>
      </div>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page-not-found%20%282%29-gFfQllB5l4kDbYJUJ4KWp9FUPNP32N.png"
        alt="Audio Books"
        width={300}
        height={300}
        className="hero-image"
      />
    </div>
  )
}
