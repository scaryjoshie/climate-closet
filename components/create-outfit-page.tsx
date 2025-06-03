"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import TextareaAutosize from 'react-textarea-autosize'

interface CreateOutfitPageProps {
  onBack: () => void
  onOutfitCreated?: (date: string) => void
  selectedDate?: string
}

export default function CreateOutfitPage({ onBack, onOutfitCreated, selectedDate }: CreateOutfitPageProps) {
  const [activityLevel, setActivityLevel] = useState("")
  const [timeOut, setTimeOut] = useState<string[]>([]) // Changed to array for multiple selections
  const [occasion, setOccasion] = useState("")
  const [extraNotes, setExtraNotes] = useState("")

  // Add loading and error states:
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const OptionGroup = ({
    title,
    options,
    selected,
    onSelect,
  }: {
    title: string
    options: Array<{ id: string; label: string; description: string }>
    selected: string
    onSelect: (id: string) => void
  }) => (
    <div className="mb-6">
      <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`
              w-full glass-card rounded-2xl p-4 text-left transition-all duration-200
              ${selected === option.id ? "selected" : "hover:bg-white/40"}
            `}
          >
            <div className="font-medium">{option.label}</div>
            <div className={`text-sm ${selected === option.id ? "text-white/90" : "text-stone-600"}`}>
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const MultiSelectTimeGroup = ({
    title,
    options,
    selected,
    onToggle,
  }: {
    title: string
    options: Array<{ id: string; label: string; description: string }>
    selected: string[]
    onToggle: (id: string) => void
  }) => (
    <div className="mb-6">
      <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            className={`
              w-full glass-card rounded-2xl p-4 text-left transition-all duration-200
              ${selected.includes(option.id) ? "selected" : "hover:bg-white/40"}
            `}
          >
            <div className="font-medium">{option.label}</div>
            <div className={`text-sm ${selected.includes(option.id) ? "text-white/90" : "text-stone-600"}`}>
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const handleTimeToggle = (timeId: string) => {
    setTimeOut((prev) => (prev.includes(timeId) ? prev.filter((id) => id !== timeId) : [...prev, timeId]))
  }

  // Helper function to get current date in user's local timezone
  const getLocalDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleGenerateOutfit = async () => {
    if (!activityLevel || timeOut.length === 0 || !occasion) {
      setError("Please fill in all required fields")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Use selected date if provided, otherwise use today's date in user's local timezone
      let outfitDate = getLocalDateString() // Default to today in user's local timezone
      
      if (selectedDate) {
        try {
          // Convert from "Month Day, Year" format to "YYYY-MM-DD"
          // Create date in local timezone to avoid timezone offset
          const parsedDate = new Date(selectedDate)
          if (!isNaN(parsedDate.getTime())) {
            // Extract year, month, day in local timezone
            const year = parsedDate.getFullYear()
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
            const day = String(parsedDate.getDate()).padStart(2, '0')
            outfitDate = `${year}-${month}-${day}`
          }
        } catch (e) {
          console.warn("Date parsing failed, using today:", selectedDate)
        }
      }

      const outfitData = {
        date: outfitDate,
        activity_level: activityLevel as "low" | "moderate" | "high",
        times_of_day: timeOut,
        occasion: occasion as "work" | "casual" | "formal" | "social",
        notes: extraNotes || undefined,
      }

      console.log("Creating outfit for date:", outfitDate, "from selectedDate:", selectedDate)

      const result = await api.createOutfit(outfitData)

      if (result.success) {
        // Navigate to outfit result or back to home
        console.log("Outfit created:", result)
        if (onOutfitCreated) {
          onOutfitCreated(outfitDate) // Pass the date to navigate to the outfit
        } else {
          onBack() // Fallback to just going back
        }
      } else {
        setError(result.error || "Failed to create outfit")
      }
    } catch (err) {
      console.error("Outfit creation error:", err)
      if (err instanceof Error) {
        if (err.message.includes("no clothing items")) {
          setError("Add some clothes to your wardrobe first!")
        } else {
          setError(err.message)
        }
      } else {
        setError("Failed to create outfit. Please try again.")
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <h1 className="font-serif text-4xl text-foreground tracking-wide text-center mb-8">Create Outfit</h1>

        {/* Form */}
        <div className="pb-32">
          <OptionGroup
            title="How active will you be?"
            options={activityOptions}
            selected={activityLevel}
            onSelect={setActivityLevel}
          />

          <MultiSelectTimeGroup
            title="When will you be out? (Select all that apply)"
            options={timeOptions}
            selected={timeOut}
            onToggle={handleTimeToggle}
          />

          <OptionGroup
            title="What's the occasion?"
            options={occasionOptions}
            selected={occasion}
            onSelect={setOccasion}
          />

          {/* Extra Notes */}
          <div className="mb-6">
            <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">Extra Notes (Optional)</h3>
            <TextareaAutosize
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Any specific preferences or requirements..."
              className="w-full p-4 glass-card rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-500 resize-none"
              minRows={4}
              maxRows={15}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateOutfit}
            disabled={isCreating || !activityLevel || timeOut.length === 0 || !occasion}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-light text-base transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating Outfit..." : "Generate Outfit"}
          </Button>
        </div>
      </div>
    </div>
  )
}