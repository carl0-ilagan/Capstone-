"use client"

import { useState, useRef, useEffect } from "react"
import { CheckCircle, X } from "lucide-react"

export function SaveConfirmationModal({
  isOpen,
  onClose,
  title = "Changes Saved",
  message = "Your changes have been saved successfully.",
}) {
  const [startX, setStartX] = useState(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const modalRef = useRef(null)

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Reset offset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0)
    }
  }, [isOpen])

  // Auto-close after 3 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleMouseDown = (e) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleTouchEnd = () => {
    if (Math.abs(offsetX) > 100) {
      onClose()
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  const handleMouseUp = () => {
    if (Math.abs(offsetX) > 100) {
      onClose()
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg transition-transform"
        style={{
          transform: `translate(-50%, -50%) translateX(${offsetX}px)`,
          opacity: Math.max(0, 1 - Math.abs(offsetX) / 200),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-graphite">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-drift-gray">{message}</p>
        </div>

        <div className="mt-2 text-center text-xs text-drift-gray italic">
          <p>Swipe left or right to dismiss</p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-md bg-soft-amber px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            OK
          </button>
        </div>
      </div>
    </>
  )
}
