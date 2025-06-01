"use client"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import CircularGauge from "./circular-gauge"
import { api } from "@/lib/api"
import { useEffect, useState } from "react"

interface WardrobePageProps {
  onCategoryClick: (category: string) => void
  onAddItem: () => void
  refreshTrigger?: number // Add trigger for analytics refresh
}

export default function WardrobePage({ onCategoryClick, onAddItem, refreshTrigger }: WardrobePageProps) {
  // Add state for real wardrobe data
  const [wardrobeCategories, setWardrobeCategories] = useState([
    { name: "Sweaters & Hoodies", apiName: "sweater", hasItems: false, itemCount: 0, image: "sweaters.png" },
    { name: "Shirts & Tops", apiName: "top", hasItems: false, itemCount: 0, image: "tops.png" },
    { name: "Jackets", apiName: "jacket", hasItems: false, itemCount: 0, image: "jacket.png" },
    { name: "Pants & Other Lower", apiName: "lower", hasItems: false, itemCount: 0, image: "pants.png" },
    { name: "Shoes & Footwear", apiName: "shoe", hasItems: false, itemCount: 0, image: "shoes.png" },
    { name: "Accessories", apiName: "accessory", hasItems: false, itemCount: 0, image: "accessories.png" },
  ])

  // Add state for real analytics data:
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)

  // Load both wardrobe data and analytics from API:
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingAnalytics(true)
        
        // Load wardrobe items to get category counts
        try {
          const wardrobeResult = await api.getWardrobe()
          if (wardrobeResult.success) {
            const categoryCounts = {
              sweater: 0,
              top: 0,
              jacket: 0,
              lower: 0,
              shoe: 0,
              accessory: 0
            }
            
            // Count items by category
            wardrobeResult.items.forEach((item: any) => {
              if (categoryCounts.hasOwnProperty(item.category)) {
                categoryCounts[item.category as keyof typeof categoryCounts]++
              }
            })
            
            // Update category counts
            setWardrobeCategories(prev => prev.map(cat => ({
              ...cat,
              itemCount: categoryCounts[cat.apiName as keyof typeof categoryCounts] || 0,
              hasItems: categoryCounts[cat.apiName as keyof typeof categoryCounts] > 0
            })))
          }
        } catch (wardrobeError) {
          console.error("Failed to load wardrobe items:", wardrobeError)
          // Keep default zero counts if wardrobe loading fails
        }
        
        // Load analytics only if refreshTrigger changed or first load
        try {
          const shouldForceRecalculate = typeof refreshTrigger === 'number' && refreshTrigger > 0
          const analyticsResult = await api.getWardrobeAnalytics(shouldForceRecalculate)
          if (analyticsResult.success) {
            setAnalytics(analyticsResult.analytics)
            console.log(`Analytics ${analyticsResult.cached ? 'loaded from cache' : 'recalculated'}`)
          }
        } catch (analyticsError) {
          console.error("Failed to load analytics:", analyticsError)
          // Analytics will remain null, but gauges will still show with defaults
        }
      } catch (err) {
        console.error("Failed to load wardrobe data:", err)
      } finally {
        setIsLoadingAnalytics(false)
      }
    }

    loadData()
  }, [refreshTrigger]) // Only reload when refreshTrigger changes

  // Always show gauges with fallback values
  const weatherSuitability = analytics?.weather_preparedness_score ?? 50
  const varietyScore = analytics?.style_diversity_score ?? 30
  const aiInsights = analytics && (analytics.analysis || analytics.recommendations) 
    ? [analytics.analysis, analytics.recommendations].filter(Boolean)
    : null

  return (
    <div className="max-w-sm mx-auto">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="box-title text-4xl tracking-wide">Your Wardrobe</h1>
          <button
            onClick={onAddItem}
            className="cozy-button"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Wardrobe Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {wardrobeCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => onCategoryClick(category.apiName)}
              className="glass-card rounded-2xl p-6 h-56 flex flex-col items-center justify-center interactive-hover transition-all duration-200"
            >
              <div className="w-full h-32 flex items-center justify-center mb-4">
                <img 
                  src={`/images/categories/${category.image}`}
                  alt={category.name}
                  className="max-w-20 max-h-20 object-contain rounded-lg"
                />
              </div>
              <h3 className="font-sans text-lg tracking-wide text-center font-medium" style={{ color: '#2d1b0f' }}>{category.name}</h3>
              <p className="cozy-secondary text-sm font-light mt-1">
                {category.itemCount} {category.itemCount === 1 ? "item" : "items"}
              </p>
            </button>
          ))}
        </div>

        {/* Add Item Button */}
        <div className="mb-8">
          <Button
            onClick={onAddItem}
            variant="outline"
            className="cozy-button w-full h-12 text-base"
          >
            <Plus className="w-4 h-4 mr-3 stroke-1" />
            Add Item
          </Button>
        </div>

        {/* Wardrobe Analytics - Always show with loading state or data */}
        {isLoadingAnalytics ? (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="box-title text-lg mb-4 tracking-wide">Wardrobe Analytics</h3>
            <div className="text-center py-4">
              <p className="cozy-secondary">Loading insights...</p>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="box-title text-lg text-foreground mb-4 tracking-wide">Wardrobe Analytics</h3>
            <div className="flex justify-around mb-6">
              <CircularGauge value={weatherSuitability} label="Weather Suitability" color="#3b82f6" />
              <CircularGauge value={varietyScore} label="Variety & Style" color="#5D4037" />
            </div>
          </div>
        )}

        {/* AI Insights - Only show if there's data */}
        {aiInsights ? (
        <div className="glass-card rounded-2xl p-6 mb-32">
          <h3 className="box-title text-lg mb-4 tracking-wide">AI Insights</h3>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 flex-shrink-0" style={{ backgroundColor: '#6b4e3d' }}></div>
                <p className="cozy-secondary text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
        ) : null}
      </div>
    </div>
  )
}
