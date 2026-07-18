"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"

export default function OTPVerificationPage() {
  const router = useRouter()
  const { pendingVerification, verifyOTP } = useAuth()
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    // Redirect if no pending verification
    if (!pendingVerification) {
      router.push("/auth/login")
    }
  }, [pendingVerification, router])

  useEffect(() => {
    // Countdown timer for resend OTP
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!otp.trim()) {
      setError("Please enter the verification code")
      setIsLoading(false)
      return
    }

    try {
      // Store OTP in sessionStorage (more secure than localStorage)
      sessionStorage.setItem("currentOTP", otp)

      // Check if we're in the password reset flow
      const isPasswordReset = sessionStorage.getItem("isPasswordReset") === "true"

      if (isPasswordReset) {
        // Skip verification and go directly to reset password page
        router.push("/auth/reset-password")
      } else {
        // Verify OTP for email verification
        const success = await verifyOTP(otp)
        if (success) {
          router.push("/auth/login")
        } else {
          setError("Invalid verification code. Please try again.")
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (isResending || countdown > 0) return

    setIsResending(true)
    setError("")

    try {
      if (!pendingVerification) {
        setError("No email address found for verification")
        return
      }

      // Call the API to resend OTP
      const response = await fetch("https://myfirstapi.runasp.net/api/Auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingVerification,
        }),
      })

      if (response.ok) {
        // Reset countdown
        setCountdown(60)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to resend verification code")
      }
    } catch (error) {
      setError("Failed to resend verification code. Please try again later.")
      console.error(error)
    } finally {
      setIsResending(false)
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
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5464649_2853457%201-jvbCuhqZGgmCx8yecufil2bn237mWc.png"
              alt="OTP Verification Illustration"
              width={400}
              height={400}
              className="illustration-img"
            />
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <h1 className="auth-title">Verification Code</h1>

            <p className="auth-description">
              We have sent a verification code to {pendingVerification}. Please enter the code below.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <div className="input-field-container">
                  <div className="input-icon-container">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify"}
              </button>

              <div className="auth-links">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isResending}
                  className="auth-link"
                >
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : isResending
                      ? "Sending..."
                      : "Resend verification code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
