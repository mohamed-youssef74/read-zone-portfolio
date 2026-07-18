"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authApi } from "@/services/api-service"
import { fetchUserLibrary } from "@/services/book-service"

type User = {
  id?: number
  username: string
  email?: string
  avatar?: string
  emailVerified?: boolean
  role?: string
  birthDate?: string
  profileImageUrl?: string
  firebaseUid?: string
  createdAt?: string
}

type RegisteredUser = {
  username: string
  email: string
  password: string
  profileImageUrl?: string
  birthDate: string
}

type AuthContextType = {
  user: User | null
  isLoggedIn: boolean
  pendingVerification: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisteredUser) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: () => Promise<void>
  getRegisteredUsers: () => RegisteredUser[]
  setPendingVerification: (email: string | null) => void
  verifyOTP: (otp: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>
  resendOTP: (email: string) => Promise<boolean>
  getCurrentUserInfo: () => Promise<void>
  uploadProfileImage: (file: File) => Promise<string>
  updateProfileImage: (file: File) => Promise<string>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pendingVerification, setPendingVerificationState] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  // دالة لتحديث المستخدم مع حفظ البيانات
  const setUser = (userData: User | null) => {
    setUserState(userData)
    if (userData) {
      sessionStorage.setItem("userData", JSON.stringify(userData))
      localStorage.setItem("userData", JSON.stringify(userData))
    } else {
      sessionStorage.removeItem("userData")
      localStorage.removeItem("userData")
    }
  }

  useEffect(() => {
    // Check if user is logged in on component mount
    const storedToken = sessionStorage.getItem("token") || localStorage.getItem("token")
    const storedRefreshToken = sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken")
    const userData = sessionStorage.getItem("userData") || localStorage.getItem("userData")
    const pendingEmail = sessionStorage.getItem("pendingVerification") || localStorage.getItem("pendingVerification")

    if (storedToken && userData) {
      setToken(storedToken)
      setRefreshToken(storedRefreshToken)
      setIsLoggedIn(true)
      fetchUserLibrary()
      setUserState(JSON.parse(userData))

      // تحديث بيانات المستخدم من الخادم
      getCurrentUserInfo().catch(console.error)
    }

    if (pendingEmail) {
      setPendingVerificationState(pendingEmail)
    }
  }, [])

  const setPendingVerification = (email: string | null) => {
    setPendingVerificationState(email)
    if (email) {
      sessionStorage.setItem("pendingVerification", email)
    } else {
      sessionStorage.removeItem("pendingVerification")
      localStorage.removeItem("pendingVerification")
    }
  }

  const getRegisteredUsers = () => {
    return []
  }

  const register = async (userData: RegisteredUser): Promise<boolean> => {
    try {
      const response = await authApi.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        profileImageUrl: userData.profileImageUrl || "",
        birthDate: userData.birthDate || new Date().toISOString(),
      })

      if (response === "User registered") {
        setPendingVerification(userData.email)
        return true
      } else {
        console.error("Registration failed")
        return false
      }
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const verifyOTP = async (otp: string): Promise<boolean> => {
    try {
      if (!pendingVerification) return false

      const response = await authApi.verifyOtp({
        email: pendingVerification,
        otp: otp,
      })

      if (response === "OTP is valid. You can now reset your password.") {
        setPendingVerification(null)
        return true
      } else {
        console.error("OTP verification failed")
        return false
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      return false
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({
        email,
        password,
      })

      if (response && response.token) {
        // Save tokens
        setToken(response.token)
        setRefreshToken(response.refreshToken)
        sessionStorage.setItem("token", response.token)
        if (response.refreshToken) {
          sessionStorage.setItem("refreshToken", response.refreshToken)
        }

        // Fetch user info from API
        try {
          const userProfile = await authApi.getProfile()

          if (userProfile) {
            const userInfo: User = {
              id: userProfile.id,
              username: userProfile.username,
              email: userProfile.email,
              avatar: userProfile.profileImageUrl,
              emailVerified: true,
              role: userProfile.role,
              birthDate: userProfile.birthDate,
              profileImageUrl: userProfile.profileImageUrl,
              firebaseUid: userProfile.firebaseUid,
              createdAt: userProfile.createdAt,
            }
            setUser(userInfo)
          } else {
            const userData: User = {
              username: response.username || email.split("@")[0],
              email: email,
              emailVerified: true,
            }
            setUser(userData)
          }
        } catch (userError) {
          console.error("Error fetching user info:", userError)
          const userData: User = {
            username: response.username || email.split("@")[0],
            email: email,
            emailVerified: true,
          }
          setUser(userData)
        }

        setIsLoggedIn(true)
        fetchUserLibrary()
        return true
      } else {
        setPendingVerification(email)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      setPendingVerification(email)
      return false
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout()
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setIsLoggedIn(false)
      setToken(null)
      setRefreshToken(null)
      sessionStorage.clear()
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("userData")
      localStorage.removeItem("pendingVerification")
    }
  }

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (userData.username) {
        const response = await authApi.updateUsername({ username: userData.username })

        if (response && response.message === "Username updated successfully") {
          const updatedUser = { ...user, username: response.newUsername }
          setUser(updatedUser)
        }
      }
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      })

      if (response === "Password changed successfully") {
        return
      } else {
        throw new Error("Password change failed")
      }
    } catch (error) {
      console.error("Change password error:", error)
      throw error
    }
  }

  const deleteAccount = async () => {
    try {
      const success = await authApi.deleteAccount()

      if (success) {
        setUser(null)
        setIsLoggedIn(false)
        setToken(null)
        setRefreshToken(null)
        sessionStorage.clear()
        localStorage.clear()
      } else {
        throw new Error("Failed to delete account")
      }
    } catch (error) {
      console.error("Delete account error:", error)
      throw error
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await authApi.forgotPassword(email)

      if (response !== null) {
        setPendingVerification(email)
        return true
      } else {
        console.error("Forgot password failed")
        return false
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      return false
    }
  }

  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await authApi.resetPassword({
        email,
        otp,
        newPassword,
      })

      if (response !== null) {
        setPendingVerification(null)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("Reset password error:", error)
      return false
    }
  }

  const resendOTP = async (email: string): Promise<boolean> => {
    try {
      const response = await authApi.forgotPassword(email)
      return response !== null
    } catch (error) {
      console.error("Resend OTP error:", error)
      return false
    }
  }

  const getCurrentUserInfo = async () => {
    try {
      const userProfile = await authApi.getProfile()

      if (userProfile) {
        const userInfo: User = {
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          avatar: userProfile.profileImageUrl,
          emailVerified: true,
          role: userProfile.role,
          birthDate: userProfile.birthDate,
          profileImageUrl: userProfile.profileImageUrl,
          firebaseUid: userProfile.firebaseUid,
          createdAt: userProfile.createdAt,
        }
        setUser(userInfo)
      }
    } catch (error) {
      console.error("Get current user error:", error)
    }
  }

  const uploadProfileImage = async (file: File): Promise<string> => {
    try {
      const response = await authApi.uploadProfileImage(file)

      if (response && response.imageUrl) {
        const updatedUser = {
          ...user,
          avatar: response.imageUrl,
          profileImageUrl: response.imageUrl,
        }
        setUser(updatedUser)
        return response.imageUrl
      } else {
        throw new Error("Failed to upload profile image")
      }
    } catch (error) {
      console.error("Upload profile image error:", error)
      throw error
    }
  }

  const updateProfileImage = async (file: File): Promise<string> => {
    try {
      const response = await authApi.updateProfileImage(file)

      if (response && response.imageUrl) {
        const updatedUser = {
          ...user,
          avatar: response.imageUrl,
          profileImageUrl: response.imageUrl,
        }
        setUser(updatedUser)
        return response.imageUrl
      } else {
        throw new Error("Failed to update profile image")
      }
    } catch (error) {
      console.error("Update profile image error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        pendingVerification,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        getRegisteredUsers,
        setPendingVerification,
        verifyOTP,
        forgotPassword,
        resetPassword,
        resendOTP,
        getCurrentUserInfo,
        uploadProfileImage,
        updateProfileImage,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
