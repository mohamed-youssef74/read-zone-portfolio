import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { CustomHead } from "@/components/custom-head"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "READ ZONE",
  description: "All your books in one place",
  generator: "m.youssef",
  metadataBase: new URL("https://readzone.app"),
  openGraph: {
    title: "READ ZONE",
    description: "All your books in one place",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <CustomHead />
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
