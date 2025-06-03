"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Cloud, CloudRain, Sun, Home, Calendar, Settings, Shirt, Plus } from "lucide-react"
import InstallPrompt from "./components/install-prompt"
import CalendarPage from "./components/calendar-page"
import SettingsPage from "./components/settings-page"
import WardrobePage from "./components/wardrobe-page"
import OutfitDisplay from "./components/outfit-display"
import CategoryView from "./components/category-view"
import CreateOutfitPage from "./components/create-outfit-page"
import AddItemPage from "./components/add-item-page"
import ItemEditPage from "./components/item-edit-page"
import ItemAnalysisPage from "./components/item-analysis-page"
import RainEffect from "./components/rain-effect"
import ImageModal from "./components/image-modal"
import { useAuth } from "./contexts/auth-context"
import AuthScreen from "./components/auth-screen"
import { api } from "./lib/api"
import { useEffect } from "react"

export default function WeatherApp() {
  const [currentPage, setCurrentPage] = useState("home")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0)

  // Image modal state
  const [modalImage, setModalImage] = useState<{isOpen: boolean, imageUrl: string, itemName: string}>({
    isOpen: false,
    imageUrl: "",
    itemName: ""
  })

  const { isAuthenticated, signOut, isLoading: authLoading } = useAuth()
  const [weatherData, setWeatherData] = useState<any>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  // State for today's outfit data
  const [todaysOutfit, setTodaysOutfit] = useState<any>(null)
  const [hasOutfitToday, setHasOutfitToday] = useState(false)
  const [outfitLoading, setOutfitLoading] = useState(true)
  const [outfitRefreshTrigger, setOutfitRefreshTrigger] = useState(0)

  // Helper function to get current date in user's local timezone  
  const getLocalDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Move these functions here, before they're used
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

  // Load weather data
  useEffect(() => {
    const loadWeather = async () => {
      try {
        setIsLoadingWeather(true)
        setWeatherError(null)
        const weather = await api.getCurrentWeather()
        setWeatherData(weather.weather)
      } catch (error) {
        console.error("Weather error:", error)
        if (error instanceof Error && error.message.includes("Failed to fetch")) {
          setWeatherError("Unable to connect to weather service. Please check your internet connection.")
        } else {
          setWeatherError("Unable to load weather data")
        }
      } finally {
        setIsLoadingWeather(false)
      }
    }

    loadWeather()
  }, [])

  // Load today's outfit on initial mount
  useEffect(() => {
    // Only load outfit if authenticated and not still loading auth
    if (isAuthenticated && !authLoading) {
      refreshTodaysOutfit()
    }
  }, [isAuthenticated, authLoading])

  // Refresh today's outfit when triggered by updates
  useEffect(() => {
    if (outfitRefreshTrigger > 0 && isAuthenticated && !authLoading) {
      refreshTodaysOutfit()
    }
  }, [outfitRefreshTrigger, isAuthenticated, authLoading])

  // Function to refresh today's outfit
  const refreshTodaysOutfit = async () => {
      try {
        setOutfitLoading(true)
      // Get today's date in user's local timezone
      const todayStr = getLocalDateString()
        
        const result = await api.getOutfitByDate(todayStr)
        
        if (result.success && result.outfit) {
          setTodaysOutfit({
            items: result.outfit.clothing_items.map((item: any) => ({
              name: item.name,
              type: item.category,
              image: item.image_url || "👕",
            }))
          })
          setHasOutfitToday(true)
        } else {
          setHasOutfitToday(false)
          setTodaysOutfit(null)
        }
      } catch (error) {
        // Don't log errors for missing outfits - this is expected
        if (error instanceof Error && !error.message.includes("No outfit found")) {
          console.error("Error loading today's outfit:", error)
        }
        setHasOutfitToday(false)
        setTodaysOutfit(null)
      } finally {
        setOutfitLoading(false)
      }
    }

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-serif text-stone-900 mb-4">Climate Closet</div>
          <div className="text-stone-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />
  }

  const currentWeather = weatherData
    ? {
        type: weatherData.current_weather || "Unknown",
        temperature: weatherData.current_temp || 0,
        feelsLike: weatherData.current_feels_like_temp || weatherData.current_temp || 0,
        high: weatherData.current_high || 0,
        low: weatherData.current_low || 0,
        windSpeed: weatherData.current_wind || 0,
        precipitation: weatherData.current_precipitation || 0,
      }
    : null

  const hourlyForecast =
    weatherData?.hourly_forecast?.map((hour: any, index: number) => ({
      time: hour.time === "now" ? "Now" : hour.time,
      temp: hour.temp,
      icon: getWeatherIcon(hour.weather),
      color: getWeatherColor(hour.weather),
      precipitation: hour.chance_precip || 0,
    })) || []

  const weeklyForecast =
    weatherData?.daily_forecast?.map((day: any, index: number) => {
      // Convert date to day name
      let dayName = day.date;
      try {
        // Check if it's a full date format like "2024-06-15"
        if (day.date && day.date.includes('-')) {
          const date = new Date(day.date);
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          
          // Normalize dates for comparison (remove time component)
          const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const normalizedDate = normalizeDate(date);
          const normalizedToday = normalizeDate(today);
          const normalizedTomorrow = normalizeDate(tomorrow);
          
          if (normalizedDate.getTime() === normalizedToday.getTime()) {
            dayName = "Today";
          } else if (normalizedDate.getTime() === normalizedTomorrow.getTime()) {
            dayName = "Tomorrow";
          } else {
            dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          }
        } else if (day.date && typeof day.date === 'string') {
          // Handle cases where day.date is already a day name
          const lowerDate = day.date.toLowerCase();
          if (lowerDate === 'today') {
            dayName = "Today";
          } else if (lowerDate === 'tomorrow') {
            dayName = "Tomorrow";
          } else {
            // Capitalize first letter
            dayName = day.date.charAt(0).toUpperCase() + day.date.slice(1);
          }
        }
      } catch (e) {
        // If date parsing fails, keep original but clean it up
        console.warn("Date parsing error:", e, "for date:", day.date);
        dayName = day.date ? String(day.date) : `Day ${index + 1}`;
      }
      
      return {
        day: dayName,
        high: day.high || 0,
        low: day.low || 0,
      icon: getWeatherIcon(day.weather),
      color: getWeatherColor(day.weather),
      };
    })?.filter((day: any, index: number, array: any[]) => {
      // Remove duplicates by day name
      return array.findIndex((d: any) => d.day === day.day) === index;
    }) || []

  const handleOutfitUpdated = () => {
    // Check if we're looking at today's outfit and refresh if so
    const todayStr = getLocalDateString()
    const today = new Date()
    const todayFormatted = `${today.toLocaleDateString("en-US", { month: "long" })} ${today.getDate()}, ${today.getFullYear()}`
    
    if (selectedDate === todayFormatted) {
      // Trigger refresh of today's outfit
      setOutfitRefreshTrigger(prev => prev + 1)
    }
    
    // Navigate back to calendar
    setCurrentPage("calendar")
  }

  const handleGoToOutfit = (date: string) => {
    setSelectedDate(date)
    setCurrentPage("outfit")
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage("category")
  }

  const handleBackToWardrobe = () => {
    setSelectedCategory(null)
    setCurrentPage("wardrobe")
  }

  const handleCreateOutfit = (selectedDate?: string) => {
    if (selectedDate) {
      setSelectedDate(selectedDate)
    }
    setCurrentPage("create-outfit")
  }

  const handleCreateOutfitForToday = () => {
    setCurrentPage("create-outfit")
  }

  const handleOutfitCreated = async (date: string) => {
    // Check if this is today's outfit and trigger refresh
    const todayStr = getLocalDateString()
    if (date === todayStr) {
      setOutfitRefreshTrigger(prev => prev + 1)
    }
    
    // Navigate to the created outfit
    // Create date in local timezone to avoid timezone offset
    const [year, month, day] = date.split('-').map(Number)
    const date_obj = new Date(year, month - 1, day) // month is 0-indexed
    const formatted_date = `${date_obj.toLocaleDateString("en-US", { month: "long" })} ${date_obj.getDate()}, ${date_obj.getFullYear()}`
    setSelectedDate(formatted_date)
    setCurrentPage("outfit")
  }

  const handleAddItem = (category?: string) => {
    if (category) {
      setSelectedCategory(category)
    }
    setCurrentPage("add-item")
  }

  const handleSeeMore = () => {
    // Get current local time
    const today = new Date()
    const todayString = `${today.toLocaleDateString("en-US", { month: "long" })} ${today.getDate()}, ${today.getFullYear()}`
    setSelectedDate(todayString)
    setCurrentPage("outfit")
  }

  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setCurrentPage("edit-item")
  }

  const handleItemUpdated = () => {
    console.log("Item updated/deleted, refreshing analytics")
    setAnalyticsRefreshTrigger(prev => prev + 1) // Trigger analytics refresh
    setCurrentPage("wardrobe")
  }

  const handleItemAdded = (itemData: any) => {
    setAnalysisData(itemData)
    setCurrentPage("item-analysis")
  }

  const handleAnalysisConfirm = () => {
    console.log("Item confirmed and added to wardrobe")
    setAnalysisData(null)
    setAnalyticsRefreshTrigger(prev => prev + 1)
    setCurrentPage("wardrobe")
  }

  const handleImageClick = (imageUrl: string, itemName: string) => {
    if (imageUrl && imageUrl.startsWith('data:')) { // Only open modal for actual images
      setModalImage({ isOpen: true, imageUrl, itemName })
    }
  }

  const closeModal = () => {
    setModalImage({ isOpen: false, imageUrl: "", itemName: "" })
  }

  const renderPage = () => {
    if (currentPage === "outfit" && selectedDate) {
      return <OutfitDisplay date={selectedDate} onBack={handleOutfitUpdated} />
    }

    if (currentPage === "category" && selectedCategory) {
      return (
        <CategoryView
          category={selectedCategory}
          onBack={handleBackToWardrobe}
          onAddItem={() => handleAddItem(selectedCategory)}
          onEditItem={handleEditItem}
        />
      )
    }

    switch (currentPage) {
      case "calendar":
        return <CalendarPage onGoToOutfit={handleGoToOutfit} onCreateOutfit={handleCreateOutfit} />
      case "wardrobe":
        return <WardrobePage onCategoryClick={handleCategoryClick} onAddItem={() => handleAddItem()} refreshTrigger={analyticsRefreshTrigger} />
      case "settings":
        return <SettingsPage />
      case "create-outfit":
        return <CreateOutfitPage onBack={() => setCurrentPage("home")} onOutfitCreated={handleOutfitCreated} selectedDate={selectedDate || undefined} />
      case "add-item":
        return (
          <AddItemPage
            onBack={() => setCurrentPage("wardrobe")}
            selectedCategory={selectedCategory}
            onItemAdded={handleItemAdded}
          />
        )
      case "edit-item":
        return selectedItem ? <ItemEditPage onBack={handleItemUpdated} item={selectedItem} /> : null
      case "item-analysis":
        return analysisData ? (
          <ItemAnalysisPage
            onBack={() => setCurrentPage("add-item")}
            onConfirm={handleAnalysisConfirm}
            analysisData={analysisData}
          />
        ) : null
      default:
        return (
          <div className="max-w-sm mx-auto">
            {/* Header with title and location */}
            <div className="pt-6 pb-4 px-4">
              <h2 className="sophisticated-body text-lg text-left opacity-75">Evanston, IL</h2>
            </div>

            {isLoadingWeather ? (
              <div className="px-2 pb-8">
                <div className="text-center">
                  <div className="font-serif text-6xl font-light text-stone-400 mb-4">--°</div>
                  <div className="text-stone-500">Loading weather...</div>
                </div>
              </div>
            ) : weatherError ? (
              <div className="px-2 pb-8">
                <div className="text-center">
                  <div className="font-serif text-6xl font-light text-stone-400 mb-4">--°</div>
                  <div className="text-red-500">{weatherError}</div>
                </div>
              </div>
            ) : currentWeather ? (
              <>
                {/* Main Weather Display - Temperature and Description Block */}
                <div className="px-2 pb-8">
                  <div className="flex mb-4">
                    {/* Temperature on the left - taking full half */}
                    <div className="w-1/2 flex justify-center">
                      <div className="font-sans text-8xl font-light leading-none tracking-tight" style={{ color: '#262626' }}>
                        {currentWeather.temperature}°
                      </div>
                    </div>

                    {/* Weather description on the right - taking full half */}
                    <div className="w-1/2 flex flex-col items-center justify-center">
                      {(() => {
                        const WeatherIcon = getWeatherIcon(currentWeather.type);
                        const weatherColor = getWeatherColor(currentWeather.type);
                        return <WeatherIcon className={`w-24 h-24 ${weatherColor} stroke-1 mb-1`} />;
                      })()}
                      <span className="sophisticated-body font-medium text-lg tracking-wide text-center">
                        {currentWeather.type}
                      </span>
                    </div>
                  </div>

                  {/* Feels like and metrics */}
                  <div className="text-center space-y-2">
                    <div className="sophisticated-body text-lg font-light">Feels like {currentWeather.feelsLike}°</div>
                    <div className="cozy-secondary text-base font-light">
                      High {currentWeather.high}° • Low {currentWeather.low}° • Wind {currentWeather.windSpeed} mph •{" "}
                      {currentWeather.precipitation}% rain
                    </div>
                  </div>
                </div>

                {/* Today's Outfit Section */}
                <div className="px-4 pb-6">
                  <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="elegant-title text-lg tracking-wide">Today's Outfit</h3>
                      {hasOutfitToday && !outfitLoading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSeeMore}
                          className="cozy-secondary hover:text-foreground font-light"
                        >
                          See more
                        </Button>
                      )}
                    </div>
                    {outfitLoading ? (
                      <div className="text-center">
                        <div className="text-base font-light text-stone-600 mb-4">Loading outfit...</div>
                      </div>
                    ) : hasOutfitToday && todaysOutfit ? (
                      <div className="space-y-3">
                        {todaysOutfit.items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div 
                              className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all"
                              onClick={() => item.image && handleImageClick(item.image, item.name)}
                            >
                              {item.image && item.image.startsWith('data:') ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span>{item.image || "👕"}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-base font-medium text-foreground">{item.name}</div>
                              <div className="text-sm text-stone-600 capitalize">{item.type}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-base font-light text-stone-600 mb-4">No outfit today</div>
                        <Button
                          onClick={handleCreateOutfitForToday}
                          className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-6 py-2 font-light"
                        >
                          <Plus className="w-4 h-4 mr-2 stroke-1" />
                          Create Outfit for Today
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hourly Forecast */}
                <div className="px-4 pb-6">
                  <div className="glass-card rounded-2xl">
                    <div className="p-5">
                      <h3 className="box-title text-lg mb-4 tracking-wide">Today</h3>
                      <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 pb-2 min-w-max">
                          {hourlyForecast.map((hour: any, index: number) => (
                            <div
                              key={index}
                              className="flex flex-col items-center min-w-[70px] space-y-1 flex-shrink-0"
                            >
                              <span className="cozy-secondary text-base font-medium">{hour.time}</span>
                              <hour.icon className={`w-8 h-8 ${hour.color} stroke-1`} />
                              <span className="sophisticated-body text-lg font-medium">{hour.temp}°</span>
                              <span className="warm-muted text-sm font-light">{hour.precipitation}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7-Day Forecast */}
                <div className="px-4 pb-32">
                  <div className="glass-card rounded-2xl">
                    <div className="p-5">
                      <h3 className="box-title text-lg mb-4 tracking-wide">This Week</h3>
                      <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 pb-2 min-w-max">
                          {weeklyForecast.map((day: any, index: number) => (
                            <div
                              key={index}
                              className="flex flex-col items-center min-w-[80px] space-y-1 flex-shrink-0"
                            >
                              <span className="cozy-secondary text-base font-medium">{day.day}</span>
                              <day.icon className={`w-8 h-8 ${day.color} stroke-1`} />
                              <div className="text-center space-y-0">
                                <div className="sophisticated-body text-lg font-medium">{day.high}°</div>
                                <div className="cozy-secondary text-base font-light">{day.low}°</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* {currentPage === "home" && <RainEffect />} */}
      {renderPage()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 editorial-nav">
        <div className="max-w-sm mx-auto px-6 py-3">
          <div className="flex justify-around items-center">
            <button className="p-2 rounded-none" onClick={() => setCurrentPage("home")}>
              <Home className={`w-6 h-6 stroke-1 ${currentPage === "home" ? "text-foreground" : "text-stone-600"}`} />
            </button>
            <button className="p-2 rounded-none" onClick={() => setCurrentPage("calendar")}>
              <Calendar
                className={`w-6 h-6 stroke-1 ${currentPage === "calendar" ? "text-foreground" : "text-stone-600"}`}
              />
            </button>
            <button className="p-2 rounded-none" onClick={() => setCurrentPage("wardrobe")}>
              <Shirt
                className={`w-6 h-6 stroke-1 ${currentPage === "wardrobe" ? "text-foreground" : "text-stone-600"}`}
              />
            </button>
            <button className="p-2 rounded-none" onClick={() => setCurrentPage("settings")}>
              <Settings
                className={`w-6 h-6 stroke-1 ${currentPage === "settings" ? "text-foreground" : "text-stone-600"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Install Prompt */}
      <InstallPrompt />

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

