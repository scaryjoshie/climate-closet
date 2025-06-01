"use client"
import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"
import { api } from "./lib/api"

export default function AuthTest() {
  const [authStatus, setAuthStatus] = useState("Checking...")
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [apiTestResult, setApiTestResult] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check Supabase connection
      console.log("🔍 Checking Supabase connection...")
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setAuthStatus(`Supabase Error: ${error.message}`)
        return
      }

      if (!session) {
        setAuthStatus("No active session")
        return
      }

      setSessionInfo({
        user_id: session.user.id,
        email: session.user.email,
        token_preview: session.access_token.substring(0, 50) + "...",
        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "Unknown"
      })

      setAuthStatus("Session found!")

      // Test API call
      console.log("🌐 Testing API call...")
      try {
        const result = await api.getUserProfile()
        setApiTestResult({ success: true, data: result })
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
        setApiTestResult({ success: false, error: errorMessage })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setAuthStatus(`Check failed: ${errorMessage}`)
    }
  }

  const testLogin = async () => {
    try {
      console.log("🔐 Testing login...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "testpassword123"
      })

      if (error) {
        setAuthStatus(`Login failed: ${error.message}`)
      } else {
        setAuthStatus("Login successful!")
        await checkAuth() // Recheck after login
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setAuthStatus(`Login error: ${errorMessage}`)
    }
  }

  const testRegister = async () => {
    try {
      console.log("📝 Testing registration...")
      const timestamp = Date.now()
      const testEmail = `test${timestamp}@example.com`
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "testpassword123",
        options: {
          data: {
            full_name: "Test User",
            display_name: "Test"
          }
        }
      })

      if (error) {
        setAuthStatus(`Registration failed: ${error.message}`)
      } else {
        setAuthStatus(`Registration successful! Email: ${testEmail}`)
        await checkAuth() // Recheck after registration
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setAuthStatus(`Registration error: ${errorMessage}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Frontend Auth Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <p className="mb-4">{authStatus}</p>
          
          <div className="space-x-4 mb-4">
            <button 
              onClick={checkAuth}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Check Auth
            </button>
            <button 
              onClick={testRegister}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Register
            </button>
            <button 
              onClick={testLogin}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Test Login
            </button>
          </div>

          {sessionInfo && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Session Info:</h3>
              <pre className="text-sm">{JSON.stringify(sessionInfo, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">API Test Result</h2>
          {apiTestResult ? (
            <div className={`p-4 rounded ${apiTestResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <pre className="text-sm">{JSON.stringify(apiTestResult, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-gray-500">No API test performed yet</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2">
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 