"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { pendingVerification, resetPassword } = useAuth()
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
    otp: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Redirect if no pending verification
    if (!pendingVerification) {
      router.push("/auth/login")
      return
    }

    // Get OTP from sessionStorage if available
    const storedOTP = sessionStorage.getItem("currentOTP")
    if (storedOTP) {
      setFormData((prev) => ({ ...prev, otp: storedOTP }))
    }
  }, [pendingVerification, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validate form
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!pendingVerification) {
      setError("Email verification is required")
      setIsLoading(false)
      return
    }

    if (!formData.otp) {
      setError("OTP is required. Please enter the verification code sent to your email.")
      setIsLoading(false)
      return
    }

    try {
      // Call resetPassword from useAuth
      const success = await resetPassword(pendingVerification, formData.otp, formData.newPassword)

      if (success) {
        // Clean up sessionStorage
        sessionStorage.removeItem("currentOTP")
        sessionStorage.removeItem("isPasswordReset")

        // Redirect to login page
        router.push("/auth/login")
      } else {
        setError("Failed to reset password. Please check your verification code and try again.")
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
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5464649_2853457%201%20%281%29-jvbCuhqZGgmCx8yecufil2bn237mWc.png"
              alt="Reset Password Illustration"
              width={400}
              height={400}
              className="illustration-img"
            />
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <h1 className="auth-title">Reset Password</h1>

            <p className="auth-description">Please create a new password for your account</p>

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
                    name="otp"
                    placeholder="Enter OTP code..."
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="input-field-container">
                  <div className="input-icon-container">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New password..."
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="input-field-container">
                  <div className="input-icon-container">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password..."
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
