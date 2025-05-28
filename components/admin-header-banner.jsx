"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Clock } from "lucide-react"

export function AdminHeaderBanner({ title, subtitle, stats = [], className = "" }) {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState("Good day")
  const [currentTime, setCurrentTime] = useState("")

  // Set greeting based on time of day
  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting("Good morning")
      else if (hour < 18) setGreeting("Good afternoon")
      else setGreeting("Good evening")

      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }

    updateTime()
    const timer = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={`relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-soft-amber/90 to-amber-500 p-6 text-white shadow-md ${className}`}
    >
      <div className="relative z-10">
        <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              {greeting}, {user?.displayName || ""}
            </h2>
            <p className="mt-1 text-sm text-white/90 sm:text-base">
              {subtitle || "Manage your healthcare system efficiently"}
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-2 sm:mt-0">
            <div className="flex h-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm px-4">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">{currentTime}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <div className="flex items-center">
                {stat.icon}
                <p className="ml-2 text-xs font-medium uppercase text-white/70">{stat.label}</p>
              </div>
              <p className="mt-1 text-xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-white/5"></div>
    </div>
  )
}
