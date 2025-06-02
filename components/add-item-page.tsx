"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera } from "lucide-react"
import { api } from "@/lib/api"
import { compressImage, shouldCompressImage, getImageSizeInfo } from "@/lib/image-utils"

interface AddItemPageProps {
  onBack: () => void
  selectedCategory?: string | null
  onItemAdded: (itemData: any) => void
}

export default function AddItemPage({ onBack, selectedCategory, onItemAdded }: AddItemPageProps) {
  const categories = [
    { display: "Sweaters & Hoodies", api: "sweater" },
    { display: "Shirts & Tops", api: "top" },
    { display: "Jackets", api: "jacket" },
    { display: "Pants & Other Lower", api: "lower" },
    { display: "Shoes & Footwear", api: "shoe" },
    { display: "Accessories", api: "accessory" },
  ]

  // Initialize category properly - convert API name to display name if needed
  const initializeCategory = () => {
    if (!selectedCategory) return ""
    
    // Check if selectedCategory is already a display name
    const byDisplay = categories.find(cat => cat.display === selectedCategory)
    if (byDisplay) return selectedCategory
    
    // Check if selectedCategory is an API name
    const byApi = categories.find(cat => cat.api === selectedCategory)
    if (byApi) return byApi.display
    
    // Fallback to selectedCategory as-is
    return selectedCategory
  }

  const [category, setCategory] = useState(initializeCategory())
  const [itemName, setItemName] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handleTakePhoto = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment" // Use rear camera on mobile
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Show file size info for large files
        if (shouldCompressImage(file, 2)) {
          const sizeInfo = getImageSizeInfo(file)
          console.log(`Large image detected: ${sizeInfo}. Will compress automatically.`)
        }
        
        setPhotoFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotoPreview(e.target?.result as string)
        }
        reader.onerror = () => {
          alert("Error reading image file. Please try again.")
        }
        reader.readAsDataURL(file)
        console.log("Photo captured:", file)
      }
    }
    input.click()
  }

  const handleAddItem = async () => {
    if (!photoFile) return;
    
    const selectedCat = categories.find((cat) => cat.display === category)
    console.log("Starting item analysis...", { category: selectedCat?.api || category, itemName })

    try {
      // Convert image to base64
      const base64Image = await compressImage(photoFile)

      // Analyze the clothing item with the API
      const analysisResult = await api.analyzeClothing({
        image_data: base64Image,
        category: selectedCat?.api || category,
        name: itemName || undefined
      })

      if (analysisResult.success) {
        // Add the image data to the analysis result for storage
        const analysisWithImage = {
          ...analysisResult.analysis,
      category: selectedCat?.api || category,
          image_data: base64Image, // Raw base64 for backend storage
          image_preview: photoPreview // Data URL for frontend display
        }
        onItemAdded(analysisWithImage)
      } else {
        console.error("Analysis failed:", analysisResult.error)
        alert("Failed to analyze item: " + (analysisResult.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error analyzing item:", error)
      alert("Error analyzing item. Please check your connection and try again.")
    }
  }

  const isFormValid = category && photoFile

  return (
    <div className="max-w-sm mx-auto">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <h1 className="font-serif text-4xl text-foreground tracking-wide text-center mb-8">Add Item</h1>

        {/* Form */}
        <div className="space-y-6 pb-32">
          {/* Category Selection */}
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
                        ? "selected shadow-inner transform scale-95"
                        : "hover:bg-stone-200 hover:transform hover:scale-105"
                    }
                  `}
                >
                  <div className="font-medium text-sm">{cat.display}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Item Name */}
          <div>
            <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">Item Name (Optional)</h3>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Blue denim jacket"
              className="w-full p-4 glass-card rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-500"
            />
            <p className="text-sm text-stone-600 mt-2">Leave blank and AI will name it for you</p>
          </div>

          {/* Photo Section */}
          <div>
            <h3 className="font-serif text-lg text-foreground mb-3 tracking-wide">Take a Photo</h3>
            <button
              onClick={handleTakePhoto}
              className={`
                w-full h-32 glass-card rounded-2xl flex flex-col items-center justify-center transition-all duration-200 overflow-hidden
                ${photoPreview ? "p-0" : "p-4"}
                ${photoPreview ? "bg-stone-200 shadow-inner" : "hover:bg-stone-100"}
              `}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Item preview"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <>
                  <Camera className="w-8 h-8 mb-2 text-stone-600" />
                  <span className="font-medium text-stone-600">Tap to take photo</span>
                </>
              )}
            </button>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAddItem}
            disabled={!isFormValid}
            className={`
              w-full h-12 rounded-2xl font-light text-base transition-all duration-200
              ${
                isFormValid
                  ? "bg-stone-900 text-white hover:bg-stone-800"
                  : "bg-stone-300 text-stone-500 cursor-not-allowed"
              }
            `}
          >
            Add Item
          </Button>
        </div>
      </div>
    </div>
  )
}
