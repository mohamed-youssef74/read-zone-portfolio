"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"

export default function ChangePasswordForm() {
  const { changePassword } = useAuth()
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match")
      return
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      await changePassword(formData.currentPassword, formData.newPassword)
      setMessage("Password changed successfully!")
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      setError(error.message || "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="change-password">
      <h2>Change Password</h2>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-update" disabled={isLoading}>
            {isLoading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  )
}
