"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"

export default function VerifyEmailPage() {
  const router = useRouter()
  // Update the imports to include generatedOTP
  const { pendingVerification, verifyOTP, generatedOTP } = useAuth()
  const [otp, setOtp] = useState(["", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [timer, setTimer] = useState(60)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Redirect if no pending verification
    if (!pendingVerification) {
      router.push("/auth/login")
    }

    // Focus on first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }

    // Set up timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [pendingVerification, router])

  const handleChange = (index: number, value: string) => {
    // Update OTP array
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input if current input is filled
    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validate OTP
    const otpValue = otp.join("")
    if (otpValue.length !== 4) {
      setError("Please enter a valid 4-digit OTP")
      setIsLoading(false)
      return
    }

    try {
      // Verify OTP using the API
      const success = await verifyOTP(otpValue)

      if (success) {
        setSuccess(true)
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push("/")
        }, 1500)
      } else {
        // Show specific error message for incorrect OTP
        setError("Incorrect verification code. Please check and try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = () => {
    // In a real app, this would trigger sending a new OTP
    setTimer(60)
    setOtp(["", "", "", ""])
    // Focus on first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
    // Show success message
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
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
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/13246826_5179437%201-WJKHJDqnvNfx3qBvZI1cHwftt88EwA.png"
              alt="Email Verification Illustration"
              width={400}
              height={400}
              className="illustration-img"
            />
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <h1 className="auth-title">Verify Your Email</h1>

            <p className="auth-description">
              We've sent a 4-digit verification code to {pendingVerification}. Please check your email and enter the
              code below to verify your email address.
            </p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="success-message">Email verified successfully! Redirecting...</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="otp-input"
                    required
                  />
                ))}
              </div>

              <p className="resend-timer">
                {timer > 0 ? (
                  <>Resend code in 00:{timer < 10 ? `0${timer}` : timer} sec</>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="auth-link"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    Resend verification code
                  </button>
                )}
              </p>

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
