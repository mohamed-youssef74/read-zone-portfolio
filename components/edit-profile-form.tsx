"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { authApi, getFullImageUrl } from "@/services/api-service"
import Image from "next/image"

export default function EditProfileForm() {
  const { user, updateProfile, setUser } = useAuth()
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile(formData)
      setIsEditing(false)
      setMessage({ type: "success", text: "Profile updated successfully!" })
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Failed to update profile" })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setMessage(null)

    // التحقق من نوع الملف
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" })
      return
    }

    // التحقق من حجم الملف (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" })
      return
    }

    setIsUploading(true)

    try {
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      })

      // رفع الصورة
      const result = await authApi.updateProfileImage(file)
      console.log("Upload result:", result)

      // جلب البيانات المحدثة
      const updatedProfile = await authApi.getProfile()

      if (updatedProfile) {
        // تحديث بيانات المستخدم
        const updatedUser = {
          id: updatedProfile.id,
          username: updatedProfile.username,
          email: updatedProfile.email,
          avatar: updatedProfile.profileImageUrl,
          emailVerified: true,
          role: updatedProfile.role,
          birthDate: updatedProfile.birthDate,
          profileImageUrl: updatedProfile.profileImageUrl,
          firebaseUid: updatedProfile.firebaseUid,
          createdAt: updatedProfile.createdAt,
        }

        setUser(updatedUser)
        setMessage({ type: "success", text: "Profile image updated successfully!" })
      }
    } catch (error: any) {
      console.error("Error uploading image:", error)
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      })
      setMessage({ type: "error", text: `Failed to upload image: ${error.message}` })
    } finally {
      setIsUploading(false)
    }
  }

  if (!isEditing) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>Profile Information</h2>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Edit Profile
          </button>
        </div>

        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
          {/* صورة البروفايل */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #e0e0e0",
                marginBottom: "10px",
              }}
            >
              <Image
                src={getFullImageUrl(user?.profileImageUrl) || "/placeholder.svg"}
                alt="Profile"
                width={120}
                height={120}
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

          {/* معلومات المستخدم */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "15px" }}>
              <strong style={{ color: "#333", fontSize: "14px" }}>Username:</strong>
              <p style={{ margin: "5px 0", fontSize: "16px" }}>{user?.username}</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong style={{ color: "#333", fontSize: "14px" }}>Email:</strong>
              <p style={{ margin: "5px 0", fontSize: "16px" }}>{user?.email}</p>
            </div>

            {user?.role && (
              <div style={{ marginBottom: "15px" }}>
                <strong style={{ color: "#333", fontSize: "14px" }}>Role:</strong>
                <p style={{ margin: "5px 0", fontSize: "16px" }}>{user.role}</p>
              </div>
            )}

            {user?.birthDate && (
              <div>
                <strong style={{ color: "#333", fontSize: "14px" }}>Birth Date:</strong>
                <p style={{ margin: "5px 0", fontSize: "16px" }}>{new Date(user.birthDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px", fontWeight: "bold" }}>Edit Profile</h2>

      {/* رسائل النجاح والخطأ */}
      {message && (
        <div
          style={{
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
            color: message.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* قسم الصورة */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div
          style={{
            position: "relative",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid #ddd",
            margin: "0 auto 15px",
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <Image
            src={getFullImageUrl(user?.profileImageUrl) || "/placeholder.svg"}
            alt="Profile"
            width={150}
            height={150}
            style={{ objectFit: "cover" }}
          />

          {/* طبقة التحميل */}
          {isUploading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Uploading...
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: "none" }}
          disabled={isUploading}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isUploading ? "not-allowed" : "pointer",
            fontSize: "14px",
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? "Uploading..." : "Change Photo"}
        </button>

        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Max file size: 5MB</p>
      </div>

      {/* نموذج البيانات */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#333",
              fontSize: "14px",
            }}
          >
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#333",
              fontSize: "14px",
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
          <button
            type="submit"
            style={{
              padding: "12px 30px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{
              padding: "12px 30px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
