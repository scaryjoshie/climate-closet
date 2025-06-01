"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Trash2, Camera } from "lucide-react"
import { api } from "@/lib/api"
import { compressImage, shouldCompressImage, getImageSizeInfo } from "@/lib/image-utils"

interface ItemEditPageProps {
  onBack: () => void
  item: {
    id: string
    name: string
    description: string
    category: string
    image_url?: string
    weather_ratings?: {
      cold: number
      hot: number
      rain: number
      wind: number
    }
  }
}

// Helper function to convert AI scale (-2 to +2) to frontend scale (1 to 5)
const convertAIRatingToFrontend = (aiRating: number): number => {
  return Math.round(((aiRating + 2) / 4) * 4) + 1
}

// Helper function to convert frontend scale (1 to 5) to AI scale (-2 to +2)
const convertFrontendRatingToAI = (frontendRating: number): number => {
  return ((frontendRating - 1) / 4) * 4 - 2
}

export default function ItemEditPage({ onBack, item }: ItemEditPageProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [coldWeather, setColdWeather] = useState(3)
  const [warmWeather, setWarmWeather] = useState(3)
  const [rainWeather, setRainWeather] = useState(3)
  const [windWeather, setWindWeather] = useState(3)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const categories = [
    { display: "Sweaters & Hoodies", api: "sweater" },
    { display: "Shirts & Tops", api: "top" },
    { display: "Jackets", api: "jacket" },
    { display: "Pants & Other Lower", api: "lower" },
    { display: "Shoes & Footwear", api: "shoe" },
    { display: "Accessories", api: "accessory" },
  ]

  // Initialize form with database data
  useEffect(() => {
    if (item) {
      setName(item.name || "")
      setDescription(item.description || "")
      
      // Map API category to display category
      const categoryMapping = categories.find(cat => cat.api === item.category)
      setCategory(categoryMapping?.display || item.category || "")
      
      setPhotoPreview(item.image_url || null)
      
      // Initialize weather ratings from database
      if (item.weather_ratings) {
        setColdWeather(convertAIRatingToFrontend(item.weather_ratings.cold || 0))
        setWarmWeather(convertAIRatingToFrontend(item.weather_ratings.hot || 0))
        setRainWeather(convertAIRatingToFrontend(item.weather_ratings.rain || 0))
        setWindWeather(convertAIRatingToFrontend(item.weather_ratings.wind || 0))
      }
    }
  }, [item])

  const handleTakePhoto = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          // Show file size info for large files
          if (shouldCompressImage(file, 2)) {
            const sizeInfo = getImageSizeInfo(file)
            console.log(`Large image detected: ${sizeInfo}. Will compress automatically.`)
          }
          
          // Always create preview from original file for immediate feedback
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotoPreview(e.target?.result as string)
        }
          reader.onerror = () => {
            alert("Error reading image file. Please try again.")
          }
        reader.readAsDataURL(file)
          
        console.log("New photo captured:", file)
        } catch (error) {
          console.error("Error processing image:", error)
          alert("Error processing image. Please try again.")
        }
      }
    }
    input.click()
  }

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

  const handleSave = async () => {
    const selectedCat = categories.find((cat) => cat.display === category)
    
    let imageData = undefined
    // If photoPreview is different from original and looks like a data URL, compress it
    if (photoPreview && photoPreview !== item.image_url && photoPreview.startsWith('data:')) {
      try {
        // Create a file from the data URL for compression
        const response = await fetch(photoPreview)
        const blob = await response.blob()
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
        
        // Compress the image
        imageData = await compressImage(file)
        console.log("Image compressed for upload")
      } catch (error) {
        console.error("Error compressing image:", error)
        // Fallback to original base64 if compression fails
        imageData = photoPreview.split(',')[1]
      }
    }
    
    const updatedItem = {
      id: item.id,
      name,
      description,
      category: selectedCat?.api || category,
      weather_ratings: {
        cold: convertFrontendRatingToAI(coldWeather),
        hot: convertFrontendRatingToAI(warmWeather),
        rain: convertFrontendRatingToAI(rainWeather),
        wind: convertFrontendRatingToAI(windWeather)
      },
      ...(imageData && { image_data: imageData }),
      ...(photoPreview === item.image_url && { image_url: item.image_url })
    }
    
    try {
      const result = await api.updateClothing(updatedItem)
      
      if (result.success) {
        console.log("Item updated successfully:", result)
    onBack()
      } else {
        console.error("Failed to update item:", result.error)
        alert("Failed to update item: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error updating item:", error)
      alert("Failed to update item. Please try again.")
    }
  }

  const handleDelete = async () => {
    try {
      const result = await api.deleteClothing(item.id)
      
      if (result.success) {
        console.log("Item deleted successfully:", result)
    onBack()
      } else {
        console.error("Failed to delete item:", result.error)
        alert("Failed to delete item: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Failed to delete item. Please try again.")
    }
  }

  if (showDeleteConfirm) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="pt-12 pb-8 px-4">
          <div className="flex items-center mb-6">
            <button onClick={() => setShowDeleteConfirm(false)} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-stone-600" />
            </button>
          </div>

          <h1 className="font-serif text-3xl text-foreground tracking-wide text-center mb-8">Delete Item</h1>

          <div className="glass-card rounded-3xl p-6 mb-8 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center text-4xl mx-auto mb-4 overflow-hidden">
              {photoPreview ? (
                <img
                  src={photoPreview || "/placeholder.svg"}
                  alt="Item"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span>{item.image_url}</span>
              )}
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{item.name}</h3>
            <p className="text-sm text-stone-600 mb-4">{item.description}</p>
            <p className="text-base text-foreground">Are you sure you want to delete this item?</p>
            <p className="text-sm text-stone-600 mt-2">This action cannot be undone.</p>
          </div>

          <div className="space-y-3 pb-32">
            <Button
              onClick={handleDelete}
              className="w-full h-12 bg-red-500 text-white hover:bg-red-600 rounded-full font-light text-base transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 mr-3 stroke-1" />
              Yes, Delete Item
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
    )
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

        <h1 className="box-title text-3xl text-center mb-4">Edit Item</h1>

        {/* Item Preview with Camera */}
        <div className="glass-card rounded-3xl p-4 mb-6 flex items-center space-x-4">
          <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img
                src={photoPreview || "/placeholder.svg"}
                alt="Item"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-4xl">{item.image_url}</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-foreground">{item.name}</h3>
            <p className="text-sm text-stone-600">{item.description}</p>
          </div>
          <button
            onClick={handleTakePhoto}
            className="p-3 rounded-2xl bg-stone-200 hover:bg-stone-300 transition-colors duration-200"
          >
            <Camera className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6 pb-32">
          {/* Name */}
          <div>
            <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">Name</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 glass-card rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Description */}
          <div>
            <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">Description</h3>
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
            <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">Category</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.api}
                  onClick={() => setCategory(cat.display)}
                  className={`
  glass-card rounded-2xl p-3 text-center transition-all duration-200
  ${
    category === cat.display
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
              <WeatherRating
                label="Wind Weather (1=Poor, 5=Excellent)"
                value={windWeather}
                onChange={setWindWeather}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSave}
              className="cozy-button w-full h-12 text-base"
            >
              <Save className="w-4 h-4 mr-3 stroke-1" />
              Save Changes
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full h-12 border-red-400 text-red-600 hover:bg-red-50 rounded-2xl font-light text-base transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 mr-3 stroke-1" />
              Delete Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
