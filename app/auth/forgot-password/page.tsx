"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { setPendingVerification, forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    try {
      // Call the forgotPassword function from useAuth
      const success = await forgotPassword(email)

      if (success) {
        // Set pending verification email
        setPendingVerification(email)

        // Mark that we're in the password reset flow
        sessionStorage.setItem("isPasswordReset", "true")

        // Navigate to OTP verification page
        router.push("/auth/otp")
      } else {
        setError("Failed to process your request. Please check your email and try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again later.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-logo">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image%20111-n40abdb3CLI37CzR8O4ER2P6E3FBl0.png"
              alt="Read Zone"
              width={120}
              height={45}
              className="logo-image"
            />
          </div>
          <div className="auth-illustration">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/28773560_7461477%201-GZgBC8b3qbiQZkCOmEm3D13Y5GiBlE.png"
              alt="Forgot Password Illustration"
              width={400}
              height={400}
              className="illustration-img"
            />
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <h1 className="auth-title">
              Forgot
              <br />
              your Password?
            </h1>

            <p className="auth-description">
              Please enter the email address you'd like your password reset information sent to
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <div className="input-field-container">
                  <div className="input-icon-container">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Email Address/ Mobile Number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
