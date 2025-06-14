"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Edit } from "lucide-react"
import { api } from "@/lib/api"
import ImageModal from "./image-modal"

interface CategoryViewProps {
  category: string
  onBack: () => void
  onAddItem: () => void
  onEditItem: (item: any) => void
}

interface WardrobeItem {
  id: number
  name: string
  category: string
  description: string
  image_url?: string
}

export default function CategoryView({ category, onBack, onAddItem, onEditItem }: CategoryViewProps) {
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Image modal state
  const [modalImage, setModalImage] = useState<{isOpen: boolean, imageUrl: string, itemName: string}>({
    isOpen: false,
    imageUrl: "",
    itemName: ""
  })

  // Category mapping - handle both short and full names
  const categoryMap: { [key: string]: string } = {
    // Full names from wardrobe page
    "Sweaters & Hoodies": "sweater",
    "Shirts & Tops": "top",
    "Jackets": "jacket", 
    "Pants & Other Lower": "lower",
    "Shoes & Footwear": "shoe",
    "Accessories": "accessory",
    // Short names for backward compatibility
    "Sweaters": "sweater",
    "Tops": "top", 
    "Pants": "lower",
    "Shoes": "shoe",
    // API names (in case they're passed directly)
    "sweater": "sweater",
    "top": "top",
    "jacket": "jacket",
    "lower": "lower", 
    "shoe": "shoe",
    "accessory": "accessory"
  }

  // Reverse mapping for display names
  const displayNameMap: { [key: string]: string } = {
    "sweater": "Sweaters & Hoodies",
    "top": "Shirts & Tops",
    "jacket": "Jackets",
    "lower": "Pants & Other Lower",
    "shoe": "Shoes & Footwear",
    "accessory": "Accessories"
  }

  // Get the proper display name for the title
  const getDisplayName = (category: string): string => {
    return displayNameMap[category] || category
  }

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await api.getWardrobe()
        
        if (result.success) {
          // Filter items by category
          const categoryKey = categoryMap[category] || category.toLowerCase()
          console.log(`CategoryView: Filtering for category="${category}", mapped to="${categoryKey}"`)
          console.log(`Available items:`, result.items.map((item: any) => ({ name: item.name, category: item.category })))
          
          const filteredItems = result.items.filter(
            (item: WardrobeItem) => item.category === categoryKey
          )
          console.log(`Filtered items:`, filteredItems.map((item: any) => ({ name: item.name, category: item.category })))
          setItems(filteredItems)
        } else {
          setError(result.error || "Failed to load items")
        }
      } catch (err) {
        console.error("Error loading wardrobe items:", err)
        setError("Failed to load items")
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
  }, [category])

  const handleDelete = (itemId: number) => {
    // Handle delete functionality
    console.log(`Delete item ${itemId}`)
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 mr-2">
              <ArrowLeft className="w-6 h-6 text-stone-600" />
            </button>
            <h1 className="box-title text-3xl tracking-wide">{getDisplayName(category)}</h1>
          </div>
          <button
            onClick={onAddItem}
            className="cozy-button-filled p-2"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-4 pb-32">
          {isLoading ? (
            <div className="glass-card rounded-3xl p-8 text-center">
              <p className="text-lg text-stone-600 font-light">Loading items...</p>
            </div>
          ) : error ? (
            <div className="glass-card rounded-3xl p-8 text-center">
              <p className="text-lg text-red-600 font-light">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-stone-600 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div 
                    className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all"
                    onClick={() => item.image_url && handleImageClick(item.image_url, item.name)}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">👕</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-foreground">{item.name}</h3>
                    <p className="text-base text-slate-600 capitalize">{item.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => onEditItem(item)}
                  className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <Edit className="w-5 h-5 text-stone-600" />
                </button>
              </div>
            ))
          ) : (
            <div className="glass-card rounded-3xl p-8 text-center">
              <p className="text-lg text-stone-600 font-light">No items in {getDisplayName(category).toLowerCase()} yet</p>
              <p className="text-sm text-stone-500 mt-2">Tap the + button to add your first item</p>
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
