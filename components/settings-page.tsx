"use client"
import { useState, useEffect } from "react"
import { Sun, Moon, User, LogOut, Save } from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { api } from "@/lib/api"
import TextareaAutosize from 'react-textarea-autosize'
import { useToast } from "./toast"

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [generalPrompt, setGeneralPrompt] = useState("")
  const [isSavingPrompt, setIsSavingPrompt] = useState(false)
  const { signOut, user } = useAuth()
  const { showToast, ToastComponent } = useToast()

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true)
        setError("")
        
        const response = await api.getUserProfile()
        setUserProfile(response.profile)
        
        // Load general prompt from preferences with better error handling
        if (response.profile) {
          const preferences = response.profile.preferences || {}
          const promptFromPrefs = preferences.general_prompt || ""
          setGeneralPrompt(promptFromPrefs)
        } else {
          setGeneralPrompt("")
        }
      } catch (error: any) {
        console.error("Error loading user profile:", error)
        
        if (error.message.includes("User profile not found")) {
          // Try to fix the profile automatically
          try {
            console.log("Attempting to fix missing user profile...")
            await api.fixUserProfile()
            // Try loading the profile again
            const response = await api.getUserProfile()
            setUserProfile(response.profile)
            
            // Load general prompt from preferences
            if (response.profile) {
              const preferences = response.profile.preferences || {}
              const promptFromPrefs = preferences.general_prompt || ""
              setGeneralPrompt(promptFromPrefs)
            }
            console.log("Profile fixed successfully!")
          } catch (fixError: any) {
            console.error("Failed to fix profile:", fixError)
            setError(error.message + " (Auto-fix failed: " + fixError.message + ")")
          }
        } else {
          setError(error.message)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  // Monitor userProfile changes and update general prompt
  useEffect(() => {
    if (userProfile) {
      if (userProfile.preferences) {
        const promptFromPrefs = userProfile.preferences.general_prompt || ""
        setGeneralPrompt(promptFromPrefs)
      } else {
        setGeneralPrompt("")
      }
    }
  }, [userProfile])

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleLogout = async () => {
    await signOut()
  }

  const handleSaveGeneralPrompt = async () => {
    try {
      setIsSavingPrompt(true)
      
      const result = await api.updateUserPreferences({
        general_prompt: generalPrompt.trim()
      })
      
      if (result.success) {
        showToast({ message: "General instructions saved successfully!", type: "success" })
      } else {
        showToast({ message: "Failed to save instructions: " + (result.error || "Unknown error"), type: "error" })
      }
    } catch (error: any) {
      console.error("Error saving general prompt:", error)
      showToast({ message: "Failed to save instructions. Please try again.", type: "error" })
    } finally {
      setIsSavingPrompt(false)
    }
  }

  const displayName = userProfile?.display_name || userProfile?.full_name || user?.display_name || user?.full_name || "User"
  const displayEmail = userProfile?.email || user?.email || "No email set"

  return (
    <div className="max-w-sm mx-auto">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <h1 className="box-title text-4xl text-center mb-8">Settings</h1>

        {/* Settings List */}
        <div className="space-y-4 pb-32">
          {/* Account Section */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="box-title text-lg mb-4">Account</h3>

            {/* Current Account */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-2 rounded-full bg-stone-200">
                <User className="w-6 h-6 text-stone-600" />
              </div>
              <div className="flex-1">
                {isLoading ? (
                  <>
                    <h4 className="font-medium text-foreground">Loading...</h4>
                    <p className="text-sm text-stone-600 font-light">Climate Closet Account</p>
                  </>
                ) : error ? (
                  <>
                    <h4 className="font-medium text-red-600">Profile Error</h4>
                    <p className="text-sm text-red-500 font-light">{error}</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-foreground">{displayName}</h4>
                    <p className="text-sm text-stone-600 font-light">{displayEmail}</p>
                  </>
                )}
              </div>
            </div>

            {/* Fix Profile Button (if error) */}
            {error && (
              <button
                onClick={async () => {
                  try {
                    setError("")
                    setIsLoading(true)
                    await api.fixUserProfile()
                    const response = await api.getUserProfile()
                    setUserProfile(response.profile)
                    
                    // Load general prompt from preferences after fixing profile
                    const preferences = response.profile?.preferences || {}
                    setGeneralPrompt(preferences.general_prompt || "")
                  } catch (fixError: any) {
                    setError("Fix failed: " + fixError.message)
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="cozy-button w-full h-12 text-base mb-4"
                style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
              >
                <span className="font-medium">Fix Profile</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="cozy-button w-full h-12 text-base flex items-center justify-center"
              style={{ borderColor: '#dc2626', color: '#dc2626' }}
            >
              <LogOut className="w-5 h-5 mr-2" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>

          {/* General Instructions Section */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="box-title text-lg mb-4">General Instructions</h3>
            <p className="text-sm text-stone-600 font-light mb-4">
              Provide general preferences about your style, needs, or any specific instructions that should be considered when creating outfits.
            </p>
            
            <TextareaAutosize
              value={generalPrompt}
              onChange={(e) => setGeneralPrompt(e.target.value)}
              placeholder="e.g., I prefer comfortable, casual outfits and avoid bright colors. I work from home most days but occasionally need business casual looks."
              className="w-full p-3 border border-slate-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm mb-4"
              minRows={3}
              maxRows={8}
              disabled={isLoading}
            />
            
            <button
              onClick={handleSaveGeneralPrompt}
              disabled={isSavingPrompt || isLoading}
              className="cozy-button-filled w-full h-10 text-sm flex items-center justify-center rounded-full"
            >
              {isSavingPrompt ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 stroke-1" />
                  Save Instructions
                </>
              )}
            </button>
          </div>

          {/* Appearance Section */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="box-title text-lg mb-4">Appearance</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-stone-200">
                  {isDarkMode ? (
                    <Moon className="w-6 h-6 text-stone-600" />
                  ) : (
                    <Sun className="w-6 h-6 text-stone-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Dark Mode</h4>
                  <p className="text-sm text-slate-600 font-light">Switch between light and dark themes</p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none
                  ${isDarkMode ? "bg-foreground" : "bg-stone-300"}
                `}
                type="button"
                role="switch"
                aria-checked={isDarkMode}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                    ${isDarkMode ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      <ToastComponent />
    </div>
  )
}
