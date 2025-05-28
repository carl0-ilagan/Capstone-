import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
  getDoc,
  addDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Get user's active sessions
export async function getUserSessions(userId) {
  try {
    // Create a reference to the sessions collection
    const sessionsRef = collection(db, "sessions")

    // Query for sessions belonging to this user
    const q = query(sessionsRef, where("userId", "==", userId), orderBy("lastActive", "desc"))

    // Execute the query
    const querySnapshot = await getDocs(q)

    // Get the current session token from localStorage
    const currentSessionToken = localStorage.getItem("sessionToken")

    // Process the results
    const sessions = []
    querySnapshot.forEach((doc) => {
      const sessionData = doc.data()

      // Add the document ID and mark if this is the current session
      sessions.push({
        id: doc.id,
        ...sessionData,
        isCurrentSession: sessionData.sessionToken === currentSessionToken,
        // Ensure IP address is never "Fetching..."
        ipAddress: sessionData.ipAddress === "Fetching..." ? "Unknown" : sessionData.ipAddress,
      })
    })

    return sessions
  } catch (error) {
    console.error("Error getting user sessions:", error)
    return []
  }
}

// Revoke (delete) a specific session
export async function revokeSession(sessionId) {
  try {
    // Get the session first to check if it exists and belongs to the user
    const sessionDoc = await getDoc(doc(db, "sessions", sessionId))

    if (!sessionDoc.exists()) {
      throw new Error("Session not found")
    }

    // Delete the session
    await deleteDoc(doc(db, "sessions", sessionId))
    return true
  } catch (error) {
    console.error("Error revoking session:", error)
    throw error
  }
}

// Revoke all sessions except the current one
export async function revokeAllOtherSessions(userId) {
  try {
    // Get the current session token
    const currentSessionToken = localStorage.getItem("sessionToken")

    if (!currentSessionToken) {
      throw new Error("No current session found")
    }

    // Get all sessions for this user
    const sessionsRef = collection(db, "sessions")
    const q = query(sessionsRef, where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    // Delete all sessions except the current one
    const batch = []
    querySnapshot.forEach((doc) => {
      const sessionData = doc.data()
      if (sessionData.sessionToken !== currentSessionToken) {
        batch.push(deleteDoc(doc.ref))
      }
    })

    // Execute all deletions
    await Promise.all(batch)

    return true
  } catch (error) {
    console.error("Error revoking other sessions:", error)
    throw error
  }
}

// Update session's last active timestamp
export async function updateSessionActivity(sessionId) {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      await updateDoc(sessionRef, {
        lastActive: serverTimestamp(),
      });
      return true;
    } else {
      console.warn(`Attempted to update non-existent session: ${sessionId}`);
      return false; // Indicate that the session was not found
    }
  } catch (error) {
    console.error("Error updating session activity:", error);
    return false;
  }
}

// Format session time for display
export function formatSessionTime(timestamp) {
  if (!timestamp) return "Unknown"

  try {
    // Convert Firebase timestamp to JavaScript Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

    // Check if the date is today
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

    // Format the time
    const timeOptions = { hour: "numeric", minute: "numeric", hour12: true }
    const formattedTime = date.toLocaleTimeString(undefined, timeOptions)

    if (isToday) {
      // Calculate minutes ago
      const minutesAgo = Math.floor((now - date) / (1000 * 60))

      if (minutesAgo < 1) {
        return "Just now"
      } else if (minutesAgo < 60) {
        return `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`
      } else {
        return formattedTime
      }
    } else {
      // Format the date
      const dateOptions = { month: "short", day: "numeric" }
      const formattedDate = date.toLocaleDateString(undefined, dateOptions)

      return `${formattedDate}, ${formattedTime}`
    }
  } catch (error) {
    console.error("Error formatting session time:", error)
    return "Unknown"
  }
}

// Function to create or update a user session
export async function createOrUpdateSession(userId, userEmail) {
  try {
    // Generate a unique session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("sessionToken", sessionToken)

    // Get device and browser information
    const deviceInfo = {
      browser: navigator.userAgent.includes("Chrome")
        ? "Chrome"
        : navigator.userAgent.includes("Firefox")
          ? "Firefox"
          : navigator.userAgent.includes("Safari")
            ? "Safari"
            : navigator.userAgent.includes("Edge")
              ? "Edge"
              : "Unknown Browser",
      os: navigator.userAgent.includes("Windows")
        ? "Windows"
        : navigator.userAgent.includes("Mac")
          ? "macOS"
          : navigator.userAgent.includes("Linux")
            ? "Linux"
            : navigator.userAgent.includes("Android")
              ? "Android"
              : navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")
                ? "iOS"
                : "Unknown OS",
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    }

    // Get IP address using a reliable service
    let ipAddress = "Unknown"
    try {
      // Try multiple IP services in case one fails
      const ipServices = ["https://api.ipify.org?format=json", "https://ipinfo.io/json", "https://api.ip.sb/jsonip"]

      // Try each service until one works
      for (const service of ipServices) {
        try {
          const response = await fetch(service)
          if (response.ok) {
            const data = await response.json()
            ipAddress = data.ip
            break
          }
        } catch (e) {
          console.log(`IP service ${service} failed, trying next...`)
        }
      }
    } catch (error) {
      console.error("Error fetching IP:", error)
    }

    // Create the session in Firestore
    const sessionData = {
      userId: userId,
      userEmail: userEmail,
      deviceName: `${deviceInfo.browser} on ${deviceInfo.os}`,
      deviceType: deviceInfo.isMobile ? "mobile" : "desktop",
      ipAddress: ipAddress,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
      sessionToken: sessionToken,
    }

    // Check for existing session with same device and IP
    const sessionsRef = collection(db, "sessions")
    const q = query(
      sessionsRef,
      where("userId", "==", userId),
      where("deviceName", "==", sessionData.deviceName),
      where("ipAddress", "==", ipAddress),
    )

    const querySnapshot = await getDocs(q)

    let sessionId

    if (!querySnapshot.empty) {
      // Update existing session
      sessionId = querySnapshot.docs[0].id
      await updateDoc(doc(db, "sessions", sessionId), {
        lastActive: serverTimestamp(),
        sessionToken: sessionToken,
      })
    } else {
      // Add new session
      const sessionRef = await addDoc(collection(db, "sessions"), sessionData)
      sessionId = sessionRef.id
    }

    // Set up heartbeat to update lastActive
    setupSessionHeartbeat(sessionId)

    return {
      id: sessionId,
      ...sessionData,
    }
  } catch (error) {
    console.error("Error creating session:", error)
    // Don't throw - this is a non-critical operation
    return {
      id: "unknown",
      deviceName: "Unknown device",
      deviceType: "unknown",
      ipAddress: "Unknown",
    }
  }
}

// Function to keep the session alive
function setupSessionHeartbeat(sessionId) {
  // Update lastActive every 5 minutes
  const heartbeatInterval = setInterval(
    async () => {
      try {
        const auth = (await import("@/lib/firebase")).auth;

        if (!auth.currentUser) {
          console.log("User logged out, clearing session heartbeat.");
          clearInterval(heartbeatInterval);
          return;
        }

        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          await updateDoc(sessionRef, {
            lastActive: serverTimestamp(),
          });
          // console.log(`Session heartbeat updated for ${sessionId}`); // Optional: uncomment for debugging
        } else {
          console.warn(`Session document not found during heartbeat: ${sessionId}. Clearing heartbeat.`);
          clearInterval(heartbeatInterval);
        }
      } catch (error) {
        console.error("Error updating session heartbeat:", error);
        clearInterval(heartbeatInterval); // Stop heartbeat on any error
      }
    },
    5 * 60 * 1000,
  ); // 5 minutes

  // Store the interval ID to clear it on logout
  window.sessionHeartbeat = heartbeatInterval;

  // Also update on page visibility changes
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      try {
        const auth = (await import("@/lib/firebase")).auth;

        if (!auth.currentUser) {
           console.log("User logged out, skipping visibility update.");
           return;
        }

        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          await updateDoc(sessionRef, {
            lastActive: serverTimestamp(),
          });
           // console.log(`Session visibility update for ${sessionId}`); // Optional: uncomment for debugging
        } else {
          console.warn(`Session document not found during visibility change: ${sessionId}. No update performed.`);
          // No need to clear interval here, heartbeat will handle it.
        }

      } catch (error) {
        console.error("Error updating session on visibility change:", error);
      }
    }
  });
}
