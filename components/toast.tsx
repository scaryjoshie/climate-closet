"use client"
import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { createPortal } from "react-dom"
import { CheckCircle, AlertCircle, X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error"
  duration?: number
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Individual Toast Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const duration = toast.duration || 2250 // Reduced from 3000 to 2250 (3/4)
    if (duration > 0) {
      const timer = setTimeout(() => {
        // Start exit animation
        setIsExiting(true)
        // Remove after animation completes
        setTimeout(() => {
          onRemove(toast.id)
        }, 300) // Match animation duration
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  const handleManualClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300) // Match animation duration
  }

  if (!mounted) return null

  return (
    <div className={`mb-2 ${isExiting ? 'animate-slide-up' : 'animate-slide-down'}`}>
      <div className={`
        glass-card rounded-2xl p-4 min-w-[280px] max-w-[400px] shadow-lg border-l-4 
        ${toast.type === "success" 
          ? "border-l-green-500 bg-green-50/95" 
          : "border-l-red-500 bg-red-50/95"
        }
      `}>
        <div className="flex items-center space-x-3">
          <div className={`
            flex-shrink-0
            ${toast.type === "success" ? "text-green-600" : "text-red-600"}
          `}>
            {toast.type === "success" 
              ? <CheckCircle className="w-5 h-5" />
              : <AlertCircle className="w-5 h-5" />
            }
          </div>
          <p className={`
            flex-1 text-sm font-medium
            ${toast.type === "success" ? "text-green-800" : "text-red-800"}
          `}>
            {toast.message}
          </p>
          <button
            onClick={handleManualClose}
            className={`
              flex-shrink-0 p-1 rounded-full hover:bg-opacity-20 transition-colors duration-200
              ${toast.type === "success" 
                ? "text-green-600 hover:bg-green-600" 
                : "text-red-600 hover:bg-red-600"
              }
            `}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast Host Component - renders all active toasts
export function ToastHost() {
  const context = useContext(ToastContext)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!context || !mounted) return null

  const { toasts, removeToast } = context as ToastContextType & { toasts: Toast[] }

  if (toasts.length === 0) return null

  const toastElement = (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div className="flex flex-col items-center pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  )

  return createPortal(toastElement, document.body)
}

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const value = {
    addToast,
    removeToast,
    toasts
  } as ToastContextType & { toasts: Toast[] }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

// Hook to use toasts from any component
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    showToast: context.addToast,
    // Legacy compatibility
    ToastComponent: () => null // No longer needed since ToastHost handles rendering
  }
} 