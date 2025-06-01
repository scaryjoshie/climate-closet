"use client"
import { useEffect, useRef } from "react"

export default function RainEffect() {
  const rainContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rainContainerRef.current) return

    const container = rainContainerRef.current
    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight
    const dropCount = Math.floor(containerWidth / 10) // One drop per 10px of width

    // Clear any existing drops
    container.innerHTML = ""

    // Create rain drops
    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement("div")
      drop.className = "rain-drop"

      // Random positioning
      const posX = Math.random() * containerWidth
      drop.style.left = `${posX}px`

      // Random size
      const size = Math.random() * 1.5 + 0.5
      drop.style.width = `${size}px`
      drop.style.height = `${Math.random() * 15 + 10}px`

      // Random speed
      const duration = Math.random() * 1 + 0.5
      drop.style.animationDuration = `${duration}s`

      // Random delay
      drop.style.animationDelay = `${Math.random() * 2}s`

      container.appendChild(drop)
    }

    // Handle window resize
    const handleResize = () => {
      if (container) {
        // Clear and recreate rain drops on resize
        container.innerHTML = ""
        const newDropCount = Math.floor(window.innerWidth / 10)

        for (let i = 0; i < newDropCount; i++) {
          const drop = document.createElement("div")
          drop.className = "rain-drop"

          const posX = Math.random() * window.innerWidth
          drop.style.left = `${posX}px`

          const size = Math.random() * 1.5 + 0.5
          drop.style.width = `${size}px`
          drop.style.height = `${Math.random() * 15 + 10}px`

          const duration = Math.random() * 1 + 0.5
          drop.style.animationDuration = `${duration}s`

          drop.style.animationDelay = `${Math.random() * 2}s`

          container.appendChild(drop)
        }
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <>
      <div className="rain-bg" ref={rainContainerRef}></div>
      <div className="fog-overlay"></div>
    </>
  )
}
