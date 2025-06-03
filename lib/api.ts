import { supabase } from './supabase'

const API_BASE_URL = "https://us-central1-dtc-2-461504.cloudfunctions.net/climatecloset-api"

export interface OutfitData {
  date: string
  activity_level: "low" | "moderate" | "high"
  times_of_day: string[]
  occasion: "work" | "casual" | "formal" | "social"
  notes?: string
}

export interface ClothingAnalysis {
  image_data: string
  category: string
  name?: string
}

export interface ClothingItem {
  category: string
  name: string
  description: string
  weather_ratings: {
    cold: number
    hot: number
    rain: number
    wind: number
  }
  image_url?: string
  image_data?: string
}

export class ClimateClosetAPI {

  constructor() {
    // No localStorage needed anymore - we use Supabase session
  }

  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`
    }

    return headers
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }

  async getUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id || null
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Network error" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  // Weather endpoint (no auth required)
  async getCurrentWeather() {
    const response = await fetch(`${API_BASE_URL}/get_weather`)
    return this.handleResponse(response)
  }

  // Weather for specific date (no auth required)
  async getWeatherForDate(date: string) {
    const response = await fetch(`${API_BASE_URL}/get_weather_for_date`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date }),
    })
    return this.handleResponse(response)
  }

  // Outfit creation
  async createOutfit(outfitData: OutfitData) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/create_outfit`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(outfitData),
    })
    return this.handleResponse(response)
  }

  // Get outfit days for calendar
  async getOutfitDays() {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/get_outfit_days`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Get specific outfit by date
  async getOutfitByDate(date: string) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/get_outfit_by_date`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ date }),
    })
    return this.handleResponse(response)
  }

  // Get wardrobe analytics
  async getWardrobeAnalytics(forceRecalculate: boolean = false) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/get_wardrobe_analytics`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ force_recalculate: forceRecalculate }),
    })
    return this.handleResponse(response)
  }

  // Analyze clothing image
  async analyzeClothing(analysisData: ClothingAnalysis) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/analyze_clothing`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(analysisData),
    })
    return this.handleResponse(response)
  }

  // Save clothing item
  async saveClothing(clothingData: ClothingItem) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/save_clothing`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(clothingData),
    })
    return this.handleResponse(response)
  }

  // Get all wardrobe items
  async getWardrobe() {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/get_wardrobe`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Get user profile
  async getUserProfile() {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/get_user_profile`, {
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Update clothing item
  async updateClothing(clothingData: ClothingItem & { id: string }) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/update_clothing`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(clothingData),
    })
    return this.handleResponse(response)
  }

  // Fix user profile
  async fixUserProfile() {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/fix_user_profile`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Delete clothing item
  async deleteClothing(itemId: string) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/delete_clothing`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ id: itemId }),
    })
    return this.handleResponse(response)
  }

  // Update outfit
  async updateOutfit(outfitData: any) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/update_outfit`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(outfitData),
    })
    return this.handleResponse(response)
  }

  // Delete outfit
  async deleteOutfit(outfitId: string) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/delete_outfit`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ id: outfitId }),
    })
    return this.handleResponse(response)
  }

  // Reshuffle outfit
  async reshuffleOutfit(reshuffleData: {
    date: string
    activity_level: string
    times_of_day: string[]
    occasion: string
    notes: string
    previous_outfit_items: string[]
  }) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/reshuffle_outfit`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(reshuffleData),
    })
    return this.handleResponse(response)
  }

  // Update user preferences
  async updateUserPreferences(preferences: any) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/update_user_preferences`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ preferences }),
    })
    return this.handleResponse(response)
  }

  // Submit outfit feedback
  async submitOutfitFeedback(feedbackData: {
    outfit_id: string
    overall_rating: number
    temp_feedback: number
    feedback_notes?: string
  }) {
    if (!(await this.isAuthenticated())) throw new Error("Authentication required")

    const response = await fetch(`${API_BASE_URL}/submit_outfit_feedback`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(feedbackData),
    })
    return this.handleResponse(response)
  }
}

// Export singleton instance
export const api = new ClimateClosetAPI()
