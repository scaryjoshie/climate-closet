"use client"
import { api } from "@/lib/api"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarPageProps {
  onGoToOutfit: (date: string) => void
  onCreateOutfit: (date: string) => void
}

export default function CalendarPage({ onGoToOutfit, onCreateOutfit }: CalendarPageProps) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Initialize with current date
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today.getDate())
  const [currentMonth, setCurrentMonth] = useState(months[today.getMonth()])
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // Add state for real outfit data:
  const [outfitDates, setOutfitDates] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const daysInMonth = new Date(currentYear, months.indexOf(currentMonth) + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, months.indexOf(currentMonth), 1).getDay()

  const days = ["S", "M", "T", "W", "T", "F", "S"]

  // Helper function to create dates in local timezone (fixes timezone offset bug)
  const createLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }

  // Replace the mock datesWithOutfits with:
  const datesWithOutfits = outfitDates
    .filter((dateStr) => {
      // Filter for current month and year being displayed
      const date = createLocalDate(dateStr) // ✅ Fixed: use local date creation
      return date.getFullYear() === currentYear && date.getMonth() === months.indexOf(currentMonth)
    })
    .map((dateStr) => {
      const date = createLocalDate(dateStr) // ✅ Fixed: use local date creation
      return date.getDate()
    })

  // Load outfit dates from API:
  useEffect(() => {
    const loadOutfitDays = async () => {
      try {
        setIsLoading(true)
        const result = await api.getOutfitDays()
        if (result.success) {
          setOutfitDates(result.outfit_dates || [])
        }
      } catch (err) {
        console.error("Failed to load outfit days:", err)
        setError("Failed to load outfit calendar")
      } finally {
        setIsLoading(false)
      }
    }

    loadOutfitDays()
  }, [])

  const generateCalendarDays = () => {
    const daysArray = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(day)
    }

    return daysArray
  }

  const handlePrevMonth = () => {
    const currentIndex = months.indexOf(currentMonth)
    if (currentIndex > 0) {
      setCurrentMonth(months[currentIndex - 1])
    } else {
      setCurrentMonth(months[11])
      setCurrentYear(currentYear - 1)
    }
  }

  const handleNextMonth = () => {
    const currentIndex = months.indexOf(currentMonth)
    if (currentIndex < 11) {
      setCurrentMonth(months[currentIndex + 1])
    } else {
      setCurrentMonth(months[0])
      setCurrentYear(currentYear + 1)
    }
  }

  const handleGoToOutfit = () => {
    // Convert to proper date format that the app expects: "Month Day, Year"
    const dateObj = new Date(currentYear, months.indexOf(currentMonth), selectedDate)
    const formattedDate = `${dateObj.toLocaleDateString("en-US", { month: "long" })} ${dateObj.getDate()}, ${dateObj.getFullYear()}`
    onGoToOutfit(formattedDate)
  }

  const handleCreateOutfit = () => {
    // Convert to proper date format that the app expects: "Month Day, Year"
    const dateObj = new Date(currentYear, months.indexOf(currentMonth), selectedDate)
    const formattedDate = `${dateObj.toLocaleDateString("en-US", { month: "long" })} ${dateObj.getDate()}, ${dateObj.getFullYear()}`
    onCreateOutfit(formattedDate)
  }

  const hasOutfitForSelectedDate = datesWithOutfits.includes(selectedDate)

  return (
    <div className="max-w-sm mx-auto">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <h1 className="box-title text-4xl text-center mb-8">Select a date</h1>

        {/* Month/Year Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={handlePrevMonth}>
            <ChevronLeft className="w-6 h-6 text-stone-600" />
          </button>
          <div className="text-center">
            <h2 className="elegant-title text-3xl mb-1">{currentMonth}</h2>
            <p className="text-lg text-stone-600">{currentYear}</p>
          </div>
          <button onClick={handleNextMonth}>
            <ChevronRight className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map((day, index) => (
            <div key={index} className="text-center text-stone-600 font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-slate-600">Loading calendar...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 mb-8">
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => day && setSelectedDate(day)}
                className={`
                h-12 w-12 rounded-full flex items-center justify-center text-lg font-light relative
                ${day === null ? "invisible" : ""}
                ${day === selectedDate ? "bg-foreground text-background" : "text-foreground hover:bg-stone-200"}
                transition-colors duration-200
              `}
                disabled={day === null}
              >
                {day}
                {day && datesWithOutfits.includes(day) && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-stone-400 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 pb-32 space-y-3">
          {hasOutfitForSelectedDate ? (
            <Button
              variant="outline"
              onClick={handleGoToOutfit}
              className="cozy-button w-full h-14 text-lg"
            >
              Go to outfit
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-center cozy-secondary font-light">No outfit created yet</div>
              <Button
                variant="outline"
                onClick={handleCreateOutfit}
                className="cozy-button w-full h-14 text-lg"
              >
                Create outfit for this day
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
