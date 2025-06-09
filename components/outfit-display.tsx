"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shuffle, ChevronDown, ChevronUp, Sun, Cloud, CloudRain, Trash2 } from "lucide-react"
import CircularGauge from "./circular-gauge"
import { api } from "@/lib/api"
import TextareaAutosize from 'react-textarea-autosize'
import ImageModal from "./image-modal"
import { useToast } from "./toast"

interface OutfitDisplayProps {
  date: string
  onBack: () => void
}

interface OutfitItem {
  id: number
  name: string
  category: string
  description: string
  image_url: string
}

interface OutfitData {
  id: number
  name: string
  outfit_date: string
  activity_level: string
  times_of_day: string[]
  occasion: string
  notes: string
  weather_match: number
  fashion_score: number
  clothing_items: OutfitItem[]
  ai_reasoning?: string
  overall_rating?: number
  temp_feedback?: number
  feedback_notes?: string
}

export default function OutfitDisplay({ date, onBack }: OutfitDisplayProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [temperatureRating, setTemperatureRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [showDayReview, setShowDayReview] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Outfit data state
  const [outfit, setOutfit] = useState<OutfitData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Outfit context states
  const [activityLevel, setActivityLevel] = useState("")
  const [timeOut, setTimeOut] = useState<string[]>([]) // Changed to array for multiple selections
  const [occasion, setOccasion] = useState("")
  const [dayNotes, setDayNotes] = useState("")

  // Image modal state
  const [modalImage, setModalImage] = useState<{isOpen: boolean, imageUrl: string, itemName: string}>({
    isOpen: false,
    imageUrl: "",
    itemName: ""
  })

  // Weather state
  const [weatherData, setWeatherData] = useState<any>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  // Toast system
  const { showToast, ToastComponent } = useToast()

  // Load outfit data when component mounts
  useEffect(() => {
    const loadOutfit = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Convert date format if needed (from "Month Day, Year" to "YYYY-MM-DD")
        let apiDate = date
        try {
          const parsedDate = new Date(date)
          if (!isNaN(parsedDate.getTime())) {
            // Extract year, month, day in local timezone to avoid timezone offset
            const year = parsedDate.getFullYear()
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
            const day = String(parsedDate.getDate()).padStart(2, '0')
            apiDate = `${year}-${month}-${day}`
          }
        } catch (e) {
          console.warn("Date parsing failed, using original:", date)
        }
        
        const result = await api.getOutfitByDate(apiDate)
        if (result.success && result.outfit) {
          setOutfit(result.outfit)
          // Pre-populate form with existing outfit data
          setActivityLevel(result.outfit.activity_level || "")
          setTimeOut(result.outfit.times_of_day || [])
          setOccasion(result.outfit.occasion || "")
          setDayNotes(result.outfit.notes || "")
          
          // Pre-populate feedback data if it exists (only if not null)
          if (result.outfit.overall_rating !== undefined && result.outfit.overall_rating !== null) {
            setSelectedRating(result.outfit.overall_rating + 2) // Convert from -2/+2 to 0-4 scale
          } else {
            setSelectedRating(null) // No feedback provided yet
          }
          if (result.outfit.temp_feedback !== undefined && result.outfit.temp_feedback !== null) {
            setTemperatureRating(result.outfit.temp_feedback + 2) // Convert from -2/+2 to 0-4 scale
          } else {
            setTemperatureRating(null) // No feedback provided yet
          }
          
          // Set feedback notes from dedicated field
          if (result.outfit.feedback_notes) {
            setFeedback(result.outfit.feedback_notes)
          } else {
            setFeedback("") // No feedback notes yet
          }
        } else {
          setError("No outfit found for this date")
        }
      } catch (err) {
        console.error("Error loading outfit:", err)
        if (err instanceof Error && err.message.includes("No outfit found")) {
          setError("No outfit found for this date")
        } else {
          setError("Failed to load outfit")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadOutfit()
  }, [date])

  // Load weather data for the outfit date
  useEffect(() => {
    const loadWeather = async () => {
      try {
        setIsLoadingWeather(true)
        setWeatherError(null)
        
        // Convert date format if needed (from "Month Day, Year" to "YYYY-MM-DD")
        let apiDate = date
        try {
          const parsedDate = new Date(date)
          if (!isNaN(parsedDate.getTime())) {
            // Extract year, month, day in local timezone to avoid timezone offset
            const year = parsedDate.getFullYear()
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
            const day = String(parsedDate.getDate()).padStart(2, '0')
            apiDate = `${year}-${month}-${day}`
          }
        } catch (e) {
          console.warn("Date parsing failed, using original:", date)
        }
        
        const weather = await api.getWeatherForDate(apiDate)
        if (weather.success) {
          setWeatherData(weather.weather)
        } else {
          setWeatherError("Unable to load weather data")
        }
      } catch (error) {
        console.error("Weather error:", error)
        setWeatherError("Unable to load weather data")
      } finally {
        setIsLoadingWeather(false)
      }
    }

    loadWeather()
  }, [date])

  // Mock scores - replace with real data when available
  const weatherScore = outfit?.weather_match || 75
  const fashionScore = outfit?.fashion_score || 75

  const activityOptions = [
    { id: "low", label: "Low Activity", description: "Sitting, light walking" },
    { id: "moderate", label: "Moderate Activity", description: "Walking, light exercise" },
    { id: "high", label: "High Activity", description: "Running, intense exercise" },
  ]

  const timeOptions = [
    { id: "morning", label: "Morning", description: "6 AM - 10 AM" },
    { id: "afternoon", label: "Afternoon", description: "10 AM - 6 PM" },
    { id: "evening", label: "Evening", description: "6 PM - 10 PM" },
  ]

  const occasionOptions = [
    { id: "casual", label: "Casual", description: "Everyday wear" },
    { id: "work", label: "Work", description: "Professional setting" },
    { id: "social", label: "Social", description: "Meeting friends, dining" },
    { id: "formal", label: "Formal", description: "Special events" },
  ]

  const HorizontalSelector = ({
    options,
    selected,
    onSelect,
    title,
  }: {
    options: Array<{ id: string; label: string; description?: string }>
    selected: string
    onSelect: (id: string) => void
    title: string
  }) => (
    <div className="mb-4">
      <h4 className="cozy-secondary text-sm font-medium mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`
      glass-card rounded-2xl p-3 text-left transition-all duration-200
      ${
        selected === option.id
                  ? "selected shadow-inner transform scale-95"
                  : "interactive-hover"
      }
    `}
          >
            <div className="font-medium text-sm">{option.label}</div>
            {option.description && (
              <div className={`text-xs mt-1 ${selected === option.id ? "text-white/90" : "warm-muted"}`}>
                {option.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  const MultiSelectTimeSelector = ({
    options,
    selected,
    onToggle,
    title,
  }: {
    options: Array<{ id: string; label: string; description?: string }>
    selected: string[]
    onToggle: (id: string) => void
    title: string
  }) => (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-foreground mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            className={`
      glass-card rounded-2xl p-3 text-left transition-all duration-200
      ${
        selected.includes(option.id)
          ? "selected shadow-inner transform scale-95"
          : "hover:bg-stone-200 hover:transform hover:scale-105"
      }
    `}
          >
            <div className="font-medium text-sm">{option.label}</div>
            {option.description && (
              <div className={`text-xs mt-1 ${selected.includes(option.id) ? "text-white/90" : "text-slate-600"}`}>
                {option.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  const handleTimeToggle = (timeId: string) => {
    setTimeOut((prev) => (prev.includes(timeId) ? prev.filter((id) => id !== timeId) : [...prev, timeId]))
  }

  const handleSubmitFeedback = async () => {
    if (!outfit || selectedRating === null || temperatureRating === null) {
      showToast({ message: "Please provide both overall and temperature ratings", type: "error" })
      return
    }
    
    try {
      const feedbackData = {
        outfit_id: outfit.id.toString(),
        overall_rating: selectedRating,
        temp_feedback: temperatureRating,
        feedback_notes: feedback.trim() || undefined
      }
      
      const result = await api.submitOutfitFeedback(feedbackData)
      
      if (result.success) {
        showToast({ message: "Feedback submitted successfully!", type: "success" })
        
        // Update local outfit state to reflect the feedback
        setOutfit(prev => prev ? {
          ...prev,
          overall_rating: selectedRating - 2, // Convert back to -2/+2 scale for storage
          temp_feedback: temperatureRating - 2 // Convert back to -2/+2 scale for storage
        } : null)
        
        // Optionally collapse the feedback section
        setShowFeedback(false)
      } else {
        showToast({ message: "Failed to submit feedback: " + (result.error || "Unknown error"), type: "error" })
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      showToast({ message: "Failed to submit feedback. Please try again.", type: "error" })
    }
  }

  const handleDeleteOutfit = async () => {
    if (!outfit) return
    
    try {
      const result = await api.deleteOutfit(outfit.id.toString())
      
      if (result.success) {
        showToast({ message: "Outfit deleted successfully!", type: "success" })
        onBack() // Go back to calendar/previous page
      } else {
        showToast({ message: "Failed to delete outfit: " + (result.error || "Unknown error"), type: "error" })
      }
    } catch (error) {
      console.error("Error deleting outfit:", error)
      showToast({ message: "Failed to delete outfit. Please try again.", type: "error" })
    }
  }

  const handleSubmitDayReview = async () => {
    if (!outfit) return
    
    try {
      const updateData = {
        id: outfit.id,
        name: outfit.name,
        activity_level: activityLevel,
        times_of_day: timeOut,
        occasion: occasion,
        notes: dayNotes,
        overall_rating: outfit.overall_rating,
        temp_feedback: outfit.temp_feedback
      }
      
      const result = await api.updateOutfit(updateData)
      
      if (result.success) {
        // Update local state to reflect the changes
        setOutfit(prev => prev ? {
          ...prev,
          activity_level: activityLevel,
          times_of_day: timeOut,
          occasion: occasion,
          notes: dayNotes
        } : null)
        
        // Show success feedback
        showToast({ message: "Preferences saved successfully!", type: "success" })
        
        // Optionally collapse the section
        setShowDayReview(false)
      } else {
        showToast({ message: "Failed to save preferences: " + (result.error || "Unknown error"), type: "error" })
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
      showToast({ message: "Failed to save preferences. Please try again.", type: "error" })
    }
  }

  const handleReshuffle = async () => {
    if (!outfit) return
    
    try {
      // Get current clothing item IDs
      const currentItemIds = outfit.clothing_items.map(item => item.id.toString())
      
      const reshuffleData = {
        date: outfit.outfit_date,
        activity_level: activityLevel || outfit.activity_level,
        times_of_day: timeOut.length > 0 ? timeOut : outfit.times_of_day,
        occasion: occasion || outfit.occasion,
        notes: dayNotes || outfit.notes || '',
        previous_outfit_items: currentItemIds
      }
      
      const result = await api.reshuffleOutfit(reshuffleData)
      
      if (result.success) {
        showToast({ message: "Outfit reshuffled successfully!", type: "success" })
        
        // Reload the outfit data to show the new reshuffled outfit without page reload
        try {
          // Convert date format if needed (from "Month Day, Year" to "YYYY-MM-DD")
          let apiDate = date
          try {
            const parsedDate = new Date(date)
            if (!isNaN(parsedDate.getTime())) {
              // Extract year, month, day in local timezone to avoid timezone offset
              const year = parsedDate.getFullYear()
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
              const day = String(parsedDate.getDate()).padStart(2, '0')
              apiDate = `${year}-${month}-${day}`
            }
          } catch (e) {
            console.warn("Date parsing failed, using original:", date)
          }
          
          const updatedOutfit = await api.getOutfitByDate(apiDate)
          if (updatedOutfit.success && updatedOutfit.outfit) {
            setOutfit(updatedOutfit.outfit)
            // Update form with the refreshed outfit data
            setActivityLevel(updatedOutfit.outfit.activity_level || "")
            setTimeOut(updatedOutfit.outfit.times_of_day || [])
            setOccasion(updatedOutfit.outfit.occasion || "")
            setDayNotes(updatedOutfit.outfit.notes || "")
          }
        } catch (refreshError) {
          console.error("Error refreshing outfit data:", refreshError)
          // If refresh fails, show a message but don't fail the whole operation
          showToast({ message: "Outfit reshuffled, but couldn't refresh display. Please refresh the page to see changes.", type: "error" })
        }
      } else {
        showToast({ message: "Failed to reshuffle outfit: " + (result.error || "Unknown error"), type: "error" })
      }
    } catch (error) {
      console.error("Error reshuffling outfit:", error)
      showToast({ message: "Failed to reshuffle outfit. Please try again.", type: "error" })
    }
  }

  const handleImageClick = (imageUrl: string, itemName: string) => {
    if (imageUrl && !imageUrl.includes('👕')) { // Only open modal for actual images, not emoji placeholders
      setModalImage({ isOpen: true, imageUrl, itemName })
    }
  }

  const closeModal = () => {
    setModalImage({ isOpen: false, imageUrl: "", itemName: "" })
  }

  // Weather helper functions (copied from weather-app.tsx)
  const getWeatherIcon = (weather: string) => {
    switch (weather?.toLowerCase()) {
      case "sunny":
      case "clear":
        return Sun
      case "cloudy":
      case "overcast":
        return Cloud
      case "rainy":
      case "rain":
        return CloudRain
      default:
        return Cloud
    }
  }

  const getWeatherColor = (weather: string) => {
    switch (weather?.toLowerCase()) {
      case "sunny":
      case "clear":
        return "text-orange-500"
      case "rainy":
      case "rain":
        return "text-blue-500"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="box-title text-lg mb-4">Delete Outfit</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{outfit?.name}"? This action cannot be undone.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleDeleteOutfit}
                className="w-full h-12 bg-red-500 text-white hover:bg-red-600 rounded-full font-light text-base transition-all duration-200"
              >
                <Trash2 className="w-4 h-4 mr-3 stroke-1" />
                Yes, Delete Outfit
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="w-full h-12 border-stone-400 text-stone-600 hover:bg-stone-100 rounded-full font-light text-base transition-all duration-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <h1 className="box-title text-3xl text-center mb-2">
          {outfit?.name || `Outfit for ${date}`}
        </h1>
        {/* Add date display */}
        <p className="text-lg text-slate-600 text-center mb-8">{date}</p>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-card rounded-2xl p-6 mb-6 text-center">
            <div className="text-slate-600">Loading outfit...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-card rounded-2xl p-6 mb-6 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <Button
              onClick={onBack}
              className="bg-slate-600 text-white hover:bg-slate-700 rounded-2xl px-6 py-2"
            >
              Go Back
            </Button>
          </div>
        )}

        {/* Outfit Display */}
        {outfit && !isLoading && !error && (
          <>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="space-y-6">
                {outfit.clothing_items.map((item, index) => (
              <div key={index} className="flex items-center space-x-6">
                <div 
                  className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-4xl flex-shrink-0 border border-gray-200 cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all"
                  onClick={() => handleImageClick(item.image_url, item.name)}
                >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-3xl">👕</span>
                      )}
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground">{item.name}</h3>
                      <p className="text-base text-slate-600 capitalize">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outfit Scores */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex justify-around">
            <CircularGauge value={weatherScore} label="Weather Match" color="#3b82f6" />
            <CircularGauge value={fashionScore} label="Fashion Score" color="#5D4037" />
          </div>
        </div>

        {/* AI Reasoning */}
        {outfit.ai_reasoning && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="box-title text-lg mb-3 tracking-wide">AI Reasoning</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{outfit.ai_reasoning}</p>
          </div>
        )}

        {/* Hourly Weather */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="box-title text-lg mb-4 tracking-wide">Weather for This Day</h3>
          {isLoadingWeather ? (
            <div className="text-center py-4">
              <p className="cozy-secondary">Loading weather...</p>
            </div>
          ) : weatherError ? (
            <div className="text-center py-4">
              <p className="text-red-500 text-sm">{weatherError}</p>
            </div>
          ) : weatherData ? (
            <>
              {/* Daily Summary */}
              {weatherData.daily_summary && (
                <div className="flex items-center justify-center mb-4 p-4 bg-stone-50 rounded-xl">
                  {(() => {
                    const WeatherIcon = getWeatherIcon(weatherData.daily_summary.weather)
                    const weatherColor = getWeatherColor(weatherData.daily_summary.weather)
                    return <WeatherIcon className={`w-12 h-12 ${weatherColor} stroke-1 mr-4`} />
                  })()}
                  <div className="text-center">
                    <div className="text-lg font-medium text-foreground capitalize">
                      {weatherData.daily_summary.weather}
                    </div>
                    <div className="cozy-secondary text-sm">
                      High {weatherData.daily_summary.high}° • Low {weatherData.daily_summary.low}°
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hourly Forecast */}
              {weatherData.hourly_forecast && weatherData.hourly_forecast.length > 0 ? (
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 pb-2 min-w-max">
                    {weatherData.hourly_forecast.map((hour: any, index: number) => {
                      const WeatherIcon = getWeatherIcon(hour.weather)
                      const weatherColor = getWeatherColor(hour.weather)
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center min-w-[70px] space-y-1 flex-shrink-0"
                        >
                          <span className="cozy-secondary text-base font-medium">{hour.time.charAt(0).toUpperCase() + hour.time.slice(1)}</span>
                          <WeatherIcon className={`w-8 h-8 ${weatherColor} stroke-1`} />
                          <span className="sophisticated-body text-lg font-medium">{hour.temp}°</span>
                          <span className="warm-muted text-sm font-light">{hour.chance_precip || 0}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="cozy-secondary text-sm">Hourly forecast not available for this date</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="cozy-secondary text-sm">Weather forecast not available for this date</p>
            </div>
          )}
        </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="mb-6 space-y-3">
          <Button
            onClick={handleReshuffle}
            variant="outline"
            className="w-full h-12 border-stone-400 text-stone-600 hover:bg-stone-100 font-light text-base rounded-full transition-colors duration-200"
          >
            <Shuffle className="w-4 h-4 mr-3 stroke-1" />
            Reshuffle Outfit
          </Button>
          
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            className="cozy-button red-button w-full h-12 text-base"
            style={{ borderColor: '#dc2626', color: '#dc2626' }}
          >
            <Trash2 className="w-4 h-4 mr-3 stroke-1" />
            Delete Outfit
          </Button>
        </div>

        {/* Expandable Day Review Section */}
        <div className="glass-card rounded-2xl mb-6">
          <button
            onClick={() => setShowDayReview(!showDayReview)}
            className="w-full p-6 flex items-center justify-between"
          >
            <h3 className="box-title text-lg tracking-wide">Your Preferences</h3>
            {showDayReview ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {showDayReview && (
            <div className="px-6 pb-6">
              <HorizontalSelector
                title="Activity Level"
                options={activityOptions}
                selected={activityLevel}
                onSelect={setActivityLevel}
              />

              <MultiSelectTimeSelector
                title="Time Out (Select all that apply)"
                options={timeOptions}
                selected={timeOut}
                onToggle={handleTimeToggle}
              />

              <HorizontalSelector
                title="Occasion"
                options={occasionOptions}
                selected={occasion}
                onSelect={setOccasion}
              />

              {/* Extra Notes */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Extra Notes</h4>
                <TextareaAutosize
                  value={dayNotes}
                  onChange={(e) => setDayNotes(e.target.value)}
                  placeholder="How did the outfit work for your day?"
                  className="w-full p-3 border border-slate-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                  minRows={4}
                  maxRows={12}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitDayReview}
                className="cozy-button-filled w-full h-10 text-sm"
              >
                Save Day Review
              </Button>
            </div>
          )}
        </div>

        {/* Expandable Feedback Section */}
        <div className="glass-card rounded-2xl mb-32">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="w-full p-6 flex items-center justify-between"
          >
            <h3 className="box-title text-lg tracking-wide">Provide Feedback</h3>
            {showFeedback ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {showFeedback && (
            <div className="px-6 pb-6">
              {/* Overall Rating */}
              <div className="mb-6">
                <h4 className="cozy-secondary text-sm font-medium mb-3">Overall Rating</h4>
                <div className="flex justify-between space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(rating - 1)}
                      className={`
                        color-rating-button flex-1
                        ${selectedRating === rating - 1 ? "selected" : ""}
                      `}
                      style={{
                        backgroundColor: `hsl(${(rating - 1) * 30}, 70%, ${selectedRating === rating - 1 ? "50%" : "80%"})`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Temperature Rating */}
              <div className="mb-6">
                <h4 className="cozy-secondary text-sm font-medium mb-3">Temperature</h4>
                <div className="flex justify-between space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setTemperatureRating(rating - 1)}
                      className={`
                        color-rating-button flex-1
                        ${temperatureRating === rating - 1 ? "selected" : ""}
                      `}
                      style={{
                        backgroundColor: temperatureRating === rating - 1
                          ? rating <= 2
                            ? "#3b82f6"
                            : rating === 3
                              ? "#10b981"
                              : "#ef4444"
                          : rating <= 2
                            ? "#93c5fd"
                            : rating === 3
                              ? "#86efac"
                              : "#fca5a5",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Too Cold</span>
                  <span>Just Right</span>
                  <span>Too Hot</span>
                </div>
              </div>

              {/* Feedback Text */}
              <TextareaAutosize
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more about this outfit..."
                className="w-full p-3 border border-slate-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm mb-4"
                minRows={5}
                maxRows={12}
              />

              {/* Submit Button */}
              <Button
                onClick={handleSubmitFeedback}
                disabled={selectedRating === null || temperatureRating === null}
                className={`
                  cozy-button-filled w-full h-10 text-sm
                  ${
                    selectedRating !== null && temperatureRating !== null
                      ? ""
                      : "opacity-50 cursor-not-allowed"
                  }
                `}
              >
                Submit Feedback
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={modalImage.isOpen}
        imageUrl={modalImage.imageUrl}
        itemName={modalImage.itemName}
        onClose={closeModal}
      />
    </div>
  )
}
