"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check } from "lucide-react"
import { api } from "@/lib/api"

interface ItemAnalysisPageProps {
  onBack: () => void
  onConfirm: () => void
  analysisData: {
    item_name: string
    description: string
    weather_ratings: {
      cold: number
      hot: number
      rain: number
      wind: number
    }
    formality_level: string
    image_data?: string // Raw base64 for backend
    image_preview?: string // Data URL for display
    // Add these for backwards compatibility with mock data
    id?: number
    name?: string
    category?: string
    image?: string
    coldWeather?: number
    warmWeather?: number
    rainWeather?: number
  }
}

export default function ItemAnalysisPage({ onBack, onConfirm, analysisData }: ItemAnalysisPageProps) {
  // Helper function to convert AI scale (-2 to +2) to frontend scale (1 to 5)
  const convertAIRatingToFrontend = (aiRating: number) => {
    // AI: -2 to +2 maps to Frontend: 1 to 5
    // -2 -> 1, -1 -> 2, 0 -> 3, 1 -> 4, 2 -> 5
    return Math.max(1, Math.min(5, aiRating + 3))
  }

  // Helper function to convert frontend scale (1 to 5) back to AI scale (-2 to +2)
  const convertFrontendRatingToAI = (frontendRating: number) => {
    // Frontend: 1 to 5 maps to AI: -2 to +2
    // 1 -> -2, 2 -> -1, 3 -> 0, 4 -> 1, 5 -> 2
    return Math.max(-2, Math.min(2, frontendRating - 3))
  }

  // Handle both API response format and mock data format
  const [name, setName] = useState(
    analysisData?.item_name || analysisData?.name || ""
  )
  const [description, setDescription] = useState(
    analysisData?.description || ""
  )
  const [category, setCategory] = useState(
    analysisData?.category || "top"
  )
  const [coldWeather, setColdWeather] = useState(
    analysisData?.weather_ratings?.cold !== undefined 
      ? convertAIRatingToFrontend(analysisData.weather_ratings.cold)
      : analysisData?.coldWeather || 3
  )
  const [warmWeather, setWarmWeather] = useState(
    analysisData?.weather_ratings?.hot !== undefined 
      ? convertAIRatingToFrontend(analysisData.weather_ratings.hot)
      : analysisData?.warmWeather || 3
  )
  const [rainWeather, setRainWeather] = useState(
    analysisData?.weather_ratings?.rain !== undefined 
      ? convertAIRatingToFrontend(analysisData.weather_ratings.rain)
      : analysisData?.rainWeather || 3
  )

  const categories = [
    { display: "Sweaters & Hoodies", api: "sweater" },
    { display: "Shirts & Tops", api: "top" },
    { display: "Jackets", api: "jacket" },
    { display: "Pants & Other Lower", api: "lower" },
    { display: "Shoes & Footwear", api: "shoe" },
    { display: "Accessories", api: "accessory" },
  ]

  const WeatherRating = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (value: number) => void
  }) => (
    <div className="mb-4">
      <h4 className="cozy-secondary text-sm font-medium mb-2">{label}</h4>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`
              color-rating-button flex-1 text-sm font-medium
              ${value === rating ? "selected" : ""}
            `}
            style={{
              backgroundColor: value === rating 
                ? `hsl(${(rating - 1) * 30}, 70%, 50%)`
                : `hsl(${(rating - 1) * 30}, 70%, 80%)`,
            }}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  )

  const handleConfirm = async () => {
    const selectedCat = categories.find((cat) => cat.api === category)
    console.log("Confirming analysis with updates:", {
      name,
      description,
      category: selectedCat?.api || category,
      coldWeather,
      warmWeather,
      rainWeather,
    })

    try {
      // Save the item to the database
      const result = await api.saveClothing({
        category: selectedCat?.api || category,
        name,
        description,
        weather_ratings: {
          cold: convertFrontendRatingToAI(coldWeather),
          hot: convertFrontendRatingToAI(warmWeather),
          rain: convertFrontendRatingToAI(rainWeather),
          wind: 0 // Default wind rating
        },
        // Pass image as base64 data if available
        ...(analysisData?.image_data && { image_data: analysisData.image_data })
      })

      if (result.success) {
        console.log("Item saved successfully:", result)
      } else {
        console.error("Failed to save item:", result.error)
      }
    } catch (error) {
      console.error("Error saving item:", error)
    }

    onConfirm()
  }

  const currentCategoryDisplay = categories.find((cat) => cat.api === category)?.display || category

  return (
    <div className="max-w-sm mx-auto">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <h1 className="box-title text-3xl text-center mb-4">Item Analysis</h1>
        <p className="cozy-secondary text-center mb-8">Review and adjust the AI analysis</p>

        {/* Item Preview */}
        <div className="glass-card rounded-3xl p-4 mb-6 flex items-center space-x-4">
          <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center overflow-hidden">
            {analysisData?.image_preview ? (
              <img
                src={analysisData.image_preview}
                alt="Item"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : analysisData?.image && analysisData.image.startsWith("data:") ? (
              <img
                src={analysisData.image}
                alt="Item"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-4xl">{analysisData?.image || "📷"}</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="elegant-title text-lg">
              {analysisData?.item_name || analysisData?.name || "New Item"}
            </h3>
            <p className="cozy-secondary text-sm">{analysisData?.description || ""}</p>
            <p className="warm-muted text-xs mt-1">{currentCategoryDisplay}</p>
          </div>
        </div>

        {/* Editable Form */}
        <div className="space-y-6 pb-32">
          {/* Name */}
          <div>
            <h3 className="elegant-title text-lg">Name</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 glass-card rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Description */}
          <div>
            <h3 className="elegant-title text-lg">Description</h3>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color, material, style..."
              className="w-full p-4 glass-card rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-500"
            />
          </div>

          {/* Category */}
          <div>
            <h3 className="elegant-title text-lg">Category</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.api}
                  onClick={() => setCategory(cat.api)}
                  className={`
                    glass-card rounded-2xl p-3 text-center transition-all duration-200
                    ${
                      category === cat.api
                        ? "bg-stone-600 text-white shadow-inner transform scale-95"
                        : "hover:bg-stone-200 hover:transform hover:scale-105"
                    }
                  `}
                >
                  <div className="font-medium text-sm">{cat.display}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Weather Suitability */}
          <div>
            <h3 className="elegant-title text-lg mb-4 tracking-wide">Weather Suitability</h3>
            <div className="glass-card rounded-2xl p-4">
              <WeatherRating label="Cold Weather (1=Poor, 5=Excellent)" value={coldWeather} onChange={setColdWeather} />
              <WeatherRating label="Warm Weather (1=Poor, 5=Excellent)" value={warmWeather} onChange={setWarmWeather} />
              <WeatherRating
                label="Rainy Weather (1=Poor, 5=Excellent)"
                value={rainWeather}
                onChange={setRainWeather}
              />
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            className="cozy-button w-full h-12 text-base"
          >
            <Check className="w-4 h-4 mr-3 stroke-1" />
            Confirm & Add to Wardrobe
          </Button>
        </div>
      </div>
    </div>
  )
}
