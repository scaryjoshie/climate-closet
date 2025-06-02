"use client"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ImageModalProps {
  isOpen: boolean
  imageUrl: string
  itemName: string
  onClose: () => void
}

export default function ImageModal({ isOpen, imageUrl, itemName, onClose }: ImageModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative max-w-4xl max-h-screen p-4 w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image Container */}
        <div className="relative max-w-full max-h-full">
          <img
            src={imageUrl}
            alt={itemName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
          />
          
          {/* Item Name Label */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
            <h3 className="text-lg font-medium text-center">{itemName}</h3>
          </div>
        </div>
      </div>
    </div>
  )
} 