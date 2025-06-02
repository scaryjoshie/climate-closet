"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shuffle, ChevronDown, ChevronUp } from "lucide-react"
import CircularGauge from "./circular-gauge"
import { api } from "@/lib/api"
import TextareaAutosize from 'react-textarea-autosize'
import ImageModal from "./image-modal"

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
}

export default function OutfitDisplay({ date, onBack }: OutfitDisplayProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [temperatureRating, setTemperatureRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [showDayReview, setShowDayReview] = useState(false)

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
    { id: "late-morning", label: "Late Morning/Early Afternoon", description: "10 AM - 2 PM" },
    { id: "late-afternoon", label: "Late Afternoon", description: "2 PM - 6 PM" },
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

  const handleSubmitFeedback = () => {
    console.log({ rating: selectedRating, temperatureRating, feedback })
    // Handle feedback submission
  }

  const handleSubmitDayReview = () => {
    console.log({ activityLevel, timeOut, occasion, dayNotes })
    // Handle day review submission
  }

  const handleReshuffle = () => {
    console.log("Reshuffling outfit...")
    // Handle outfit reshuffling
  }

  const handleImageClick = (imageUrl: string, itemName: string) => {
    if (imageUrl && !imageUrl.includes('👕')) { // Only open modal for actual images, not emoji placeholders
      setModalImage({ isOpen: true, imageUrl, itemName })
    }
  }

  const closeModal = () => {
    setModalImage({ isOpen: false, imageUrl: "", itemName: "" })
  }

  return (
    <div className="max-w-sm mx-auto">
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
          </>
        )}

        {/* Reshuffle Button */}
        <div className="mb-6">
          <Button
            onClick={handleReshuffle}
            variant="outline"
            className="w-full h-12 border-stone-400 text-stone-600 hover:bg-stone-100 font-light text-base rounded-2xl transition-colors duration-200"
          >
            <Shuffle className="w-4 h-4 mr-3 stroke-1" />
            Reshuffle Outfit
          </Button>
        </div>

        {/* Expandable Day Review Section */}
        <div className="glass-card rounded-2xl mb-6">
          <button
            onClick={() => setShowDayReview(!showDayReview)}
            className="w-full p-6 flex items-center justify-between"
          >
            <h3 className="box-title text-lg tracking-wide">Your Day</h3>
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
