"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  MessageSquare,
  Pill,
  User,
  FileText,
  Check,
  X,
  RefreshCw,
  CheckCircle,
  Share2,
  Plus,
  Trash2,
  Edit,
  Bell,
} from "lucide-react"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import NoNotificationsAnimation from "./no-notifications-animation"

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [userSettings, setUserSettings] = useState(null)
  const { user } = useAuth()
  const isDoctor = typeof window !== "undefined" && window.location.pathname.includes("/doctor")

  // Fetch user settings
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return

      try {
        const settingsDoc = await getDoc(doc(db, "userSettings", user.uid))
        if (settingsDoc.exists()) {
          setUserSettings(settingsDoc.data())
        } else {
          // Default settings if none exist
          setUserSettings({
            notifications: {
              appointments: true,
              messages: true,
              prescriptions: true,
              reminders: true,
              patientUpdates: true,
              marketing: false,
            },
          })
        }
      } catch (error) {
        console.error("Error fetching user settings:", error)
        // Set default settings on error
        setUserSettings({
          notifications: {
            appointments: true,
            messages: true,
            prescriptions: true,
            reminders: true,
            patientUpdates: true,
            marketing: false,
          },
        })
      }
    }

    fetchUserSettings()
  }, [user])

  // Fetch notifications based on user settings - using real-time updates
  useEffect(() => {
    if (!user || !userSettings) return

    setLoading(true)

    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5))

      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const notificationsData = []
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            notificationsData.push({
              id: doc.id,
              ...data,
              time: formatTimeAgo(data.createdAt?.toDate() || new Date()),
              createdAt: data.createdAt?.toDate() || new Date(),
            })
          })

          // Filter notifications based on user settings
          const filteredNotifications = notificationsData.filter((notification) => {
            const settings = userSettings.notifications

            switch (notification.type) {
              case "appointment":
                return settings.appointments
              case "message":
                return settings.messages
              case "prescription":
                return settings.prescriptions
              case "patient":
                return settings.patientUpdates
              case "marketing":
                return settings.marketing
              default:
                return true
            }
          })

          setNotifications(filteredNotifications)
          setLoading(false)
        },
        (error) => {
          console.error("Error getting notifications:", error)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up notification listener:", error)
      setLoading(false)
    }
  }, [user, userSettings])

  const formatTimeAgo = (date) => {
    if (!date) return "Just now"

    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 172800) return "Yesterday"
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  const markAsRead = async (id) => {
    try {
      // Update in Firestore
      const notificationRef = doc(db, "notifications", id)
      await updateDoc(notificationRef, { read: true })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Update in Firestore - batch update
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        if (!notification.read) {
          const notificationRef = doc(db, "notifications", notification.id)
          batch.update(notificationRef, { read: true })
        }
      })
      await batch.commit()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const getIcon = (notification) => {
    const { type, action } = notification

    // Doctor-specific icons
    if (isDoctor) {
      if (type === "appointment") {
        switch (action) {
          case "add":
            return <Plus className="h-5 w-5 text-soft-amber" />
          case "delete":
            return <Trash2 className="h-5 w-5 text-red-500" />
          case "cancel":
            return <X className="h-5 w-5 text-red-500" />
          case "reschedule":
            return <RefreshCw className="h-5 w-5 text-blue-500" />
          case "complete":
            return <CheckCircle className="h-5 w-5 text-green-500" />
          default:
            return <Calendar className="h-5 w-5 text-soft-amber" />
        }
      }
      if (type === "record") {
        switch (action) {
          case "share":
            return <Share2 className="h-5 w-5 text-purple-500" />
          default:
            return <FileText className="h-5 w-5 text-purple-500" />
        }
      }
      if (type === "message") {
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      }
      return <User className="h-5 w-5 text-green-500" />
    }

    // Patient-specific icons
    else {
      if (type === "prescription") {
        switch (action) {
          case "add":
            return <Plus className="h-5 w-5 text-green-500" />
          default:
            return <Pill className="h-5 w-5 text-green-500" />
        }
      }
      if (type === "appointment") {
        switch (action) {
          case "add":
            return <Plus className="h-5 w-5 text-soft-amber" />
          case "delete":
            return <Trash2 className="h-5 w-5 text-red-500" />
          case "cancel":
            return <X className="h-5 w-5 text-red-500" />
          case "reschedule":
            return <RefreshCw className="h-5 w-5 text-blue-500" />
          case "complete":
            return <CheckCircle className="h-5 w-5 text-green-500" />
          case "approve":
            return <Check className="h-5 w-5 text-green-500" />
          default:
            return <Calendar className="h-5 w-5 text-soft-amber" />
        }
      }
      if (type === "record") {
        switch (action) {
          case "note":
            return <Edit className="h-5 w-5 text-purple-500" />
          default:
            return <FileText className="h-5 w-5 text-purple-500" />
        }
      }
      if (type === "message") {
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      }
      return <Bell className="h-5 w-5 text-drift-gray" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationLink = (notification) => {
    // Determine the correct link based on user role and notification type
    const basePath = isDoctor ? "/doctor" : "/dashboard"

    switch (notification.type) {
      case "appointment":
        return `${basePath}/appointments`
      case "message":
        return isDoctor ? `${basePath}/chat` : `${basePath}/messages`
      case "prescription":
        return `${basePath}/prescriptions`
      case "record":
        return isDoctor ? `/doctor/patients/${notification.patientId}/records` : `${basePath}/records`
      case "patient":
        return `/doctor/patients/${notification.patientId || ""}`
      default:
        return `${basePath}/notifications`
    }
  }

  if (loading) {
    return (
      <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md border border-pale-stone bg-white p-4 shadow-lg">
        <div className="flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-soft-amber border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md border border-pale-stone bg-white shadow-lg z-50">
      <div className="p-2 bg-white">
        <div className="flex items-center justify-between border-b border-pale-stone pb-2">
          <h3 className="text-sm font-bold text-graphite">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs font-medium text-soft-amber hover:underline">
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {Array.isArray(notifications) && notifications.length > 0 ? (
            <div className="divide-y divide-pale-stone">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getNotificationLink(notification)}
                  className={`block p-3 transition-colors hover:bg-pale-stone ${!notification.read ? "bg-soft-amber/5" : ""}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <div
                        className={`rounded-full p-2 ${
                          notification.type === "appointment"
                            ? "bg-soft-amber/20"
                            : notification.type === "message"
                              ? "bg-blue-100"
                              : notification.type === "prescription"
                                ? "bg-green-100"
                                : notification.type === "record"
                                  ? "bg-purple-100"
                                  : notification.type === "patient"
                                    ? "bg-green-100"
                                    : "bg-gray-100"
                        }`}
                      >
                        {getIcon(notification)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-graphite line-clamp-1">{notification.title}</p>
                      <p className="text-xs text-drift-gray line-clamp-2">{notification.message}</p>
                      <p className="mt-1 text-xs text-drift-gray flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-soft-amber"></div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center">
              <NoNotificationsAnimation />
              <p className="mt-2 text-sm text-drift-gray">No notifications</p>
            </div>
          )}
        </div>

        <div className="border-t border-pale-stone pt-2 mt-1">
          <Link
            href={isDoctor ? "/doctor/notifications" : "/dashboard/notifications"}
            className="block text-center text-xs font-medium text-soft-amber hover:underline py-1"
          >
            View all notifications
          </Link>
        </div>
      </div>
    </div>
  )
}
