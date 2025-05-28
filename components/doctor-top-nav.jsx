"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
  FileArchive,
  MessageCircle,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { LogoutConfirmation } from "@/components/logout-confirmation"
import { useAuth } from "@/contexts/auth-context"
import { NotificationBell } from "./notification-bell"
import ProfileImage from "./profile-image"
import { Logo } from "@/components/logo"

export function DoctorTopNav() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)
  const { user, userProfile, logout } = useAuth()

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUserMenu, showNotifications])

  // Desktop navigation links
  const desktopNavLinks = [
    { href: "/doctor/dashboard", label: "Dashboard", icon: Home },
    { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
    { href: "/doctor/patients", label: "Patients", icon: Users },
    { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/doctor/chat", label: "Messages", icon: MessageSquare },
  ]

  // User menu links - now includes Records
  const userMenuLinks = [
    { href: "/doctor/profile", label: "Profile", icon: User },
    { href: "/doctor/records", label: "Medical Records", icon: FileArchive },
    { href: "/doctor/feedback", label: "Feedback & Support", icon: MessageCircle },
    { href: "/doctor/settings", label: "Settings", icon: Settings },
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Get profile photo URL from userProfile or user
  const profilePhotoURL = userProfile?.photoURL || user?.photoURL || null

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-pale-stone bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center md:w-1/3">
            <Logo href="/doctor/dashboard" showBadge={true} badgeText="Doctor" />
          </div>

          {!isMobile && (
            <nav className="hidden md:flex md:w-1/3 md:justify-center">
              <div className="flex space-x-1">
                {desktopNavLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-pale-stone text-soft-amber"
                          : "text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                      }`}
                    >
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </nav>
          )}

          <div className="flex items-center justify-end space-x-4 md:w-1/3">
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="relative user-menu-container" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center rounded-full text-drift-gray hover:text-soft-amber"
                >
                  <ProfileImage src={profilePhotoURL} alt="Doctor" className="h-8 w-8" role="doctor" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-pale-stone bg-white shadow-lg">
                    <div className="p-2">
                      <div className="border-b border-pale-stone pb-2 mb-2">
                        <p className="px-3 py-1 text-sm font-medium text-graphite">
                          {userProfile?.displayName || user?.displayName || "Dr. User"}
                        </p>
                        <p className="px-3 py-1 text-xs text-drift-gray">
                          {userProfile?.email || user?.email || "doctor@example.com"}
                        </p>
                      </div>
                      {userMenuLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center rounded-md px-3 py-2 text-sm text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          setShowLogoutConfirmation(true)
                        }}
                        className="flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <LogoutConfirmation
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
      />
    </>
  )
}
