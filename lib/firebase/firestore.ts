import { deleteUser } from "firebase/auth"
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore"
import { auth, db } from "./config"

// User functions
export const createUser = async (uid: string, userData: any) => {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Add timestamp for createdAt if not provided
      const dataToSave = {
        ...userData,
        rooms: [],
        createdAt: userData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAdmin: userData.isAdmin || false, // Add isAdmin field
        phoneNumber: userData.phoneNumber || "", // Add phoneNumber field
      }

      await setDoc(userRef, dataToSave)
      console.log("User created successfully:", uid)
    } else {
      // Update existing user data
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      })
      console.log("User updated successfully:", uid)
    }

    return uid
  } catch (error) {
    console.error("Error creating/updating user:", error)
    throw error
  }
}

// Room functions
export const createRoom = async (name: string, creatorId: string) => {
  try {
    // Create room document
    const roomsRef = collection(db, "rooms")
    const roomDoc = await addDoc(roomsRef, {
      name,
      members: [creatorId],
      createdBy: creatorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log("Room created successfully:", roomDoc.id)

    // Update user's rooms array
    const userRef = doc(db, "users", creatorId)
    await updateDoc(userRef, {
      rooms: arrayUnion(roomDoc.id),
      updatedAt: serverTimestamp(),
    })

    return roomDoc.id
  } catch (error) {
    console.error("Error creating room:", error)
    throw error
  }
}

export const getRooms = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return []
    }

    const userData = userSnap.data()
    const roomIds = userData.rooms || []

    if (roomIds.length === 0) {
      return []
    }

    const rooms = []

    for (const roomId of roomIds) {
      const roomRef = doc(db, "rooms", roomId)
      const roomSnap = await getDoc(roomRef)

      if (roomSnap.exists()) {
        const roomData = roomSnap.data()
        rooms.push({
          id: roomId,
          name: roomData.name,
          members: roomData.members,
          createdAt: roomData.createdAt?.toDate() || new Date(),
        })
      }
    }

    return rooms
  } catch (error) {
    console.error("Error getting rooms:", error)
    throw error
  }
}

export const getRoom = async (roomId: string) => {
  try {
    const roomRef = doc(db, "rooms", roomId)
    const roomSnap = await getDoc(roomRef)

    if (!roomSnap.exists()) {
      throw new Error("Room not found")
    }

    const roomData = roomSnap.data()

    // Fetch member details
    const memberPromises = roomData.members.map(async (memberId: string) => {
      const userRef = doc(db, "users", memberId)
      const userSnap = await getDoc(userRef)
      return {
        id: memberId,
        ...userSnap.data(),
      }
    })

    const members = await Promise.all(memberPromises)

    return {
      id: roomId,
      name: roomData.name,
      members,
      createdAt: roomData.createdAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error getting room:", error)
    throw error
  }
}

export const joinRoom = async (roomId: string, userId: string) => {
  try {
    // Update room members
    const roomRef = doc(db, "rooms", roomId)
    await updateDoc(roomRef, {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    })

    // Update user's rooms
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      rooms: arrayUnion(roomId),
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error joining room:", error)
    throw error
  }
}

// Vibe functions
export const sendVibe = async (roomId: string, senderId: string, type: string, senderName: string) => {
  try {
    const vibesRef = collection(db, "vibes")
    const vibeDoc = await addDoc(vibesRef, {
      roomId,
      senderId,
      senderName,
      type,
      sentAt: serverTimestamp(),
    })

    // Get the room data
    const roomRef = doc(db, "rooms", roomId)
    const roomSnap = await getDoc(roomRef)
    const roomData = roomSnap.data()

    // Create notifications for other room members
    const notificationsRef = collection(db, "notifications")
    const notificationPromises = roomData.members
      .filter((memberId: string) => memberId !== senderId)
      .map((memberId: string) =>
        addDoc(notificationsRef, {
          userId: memberId,
          type: "vibe",
          roomId,
          senderId,
          senderName,
          vibeType: type,
          createdAt: serverTimestamp(),
          read: false,
        }),
      )

    await Promise.all(notificationPromises)

    console.log("Vibe sent successfully:", vibeDoc.id)
    return vibeDoc.id
  } catch (error) {
    console.error("Error sending vibe:", error)
    throw error
  }
}

// Get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      throw new Error("User not found")
    }

    return {
      id: userId,
      ...userSnap.data(),
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    throw error
  }
}

// Update user online status
export const updateUserStatus = async (userId: string, isOnline: boolean) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      online: isOnline,
      lastSeen: isOnline ? null : serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating user status:", error)
    throw error
  }
}

// Get all users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, "users")
    const usersSnap = await getDocs(usersRef)
    const users: any[] = []

    usersSnap.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return users
  } catch (error) {
    console.error("Error getting all users:", error)
    throw error
  }
}

// Get all rooms
export const getAllRooms = async () => {
  try {
    const roomsRef = collection(db, "rooms")
    const roomsSnap = await getDocs(roomsRef)
    const rooms: any[] = []

    roomsSnap.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return rooms
  } catch (error) {
    console.error("Error getting all rooms:", error)
    throw error
  }
}

// Update user profile
export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Get notifications for a user
export const getNotifications = async (userId: string) => {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const notifications: any[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        message: formatNotificationMessage(data),
      })
    })

    return notifications
  } catch (error) {
    console.error("Error getting notifications:", error)
    throw error
  }
}

// Mark a notification as read
export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      read: true,
    })

    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export const removeUserFromRoom = async (userId: string, roomId: string) => {
  const roomRef = doc(db, "rooms", roomId)
  const userRef = doc(db, "users", userId)

  await updateDoc(roomRef, {
    members: arrayRemove(userId),
  })

  await updateDoc(userRef, {
    rooms: arrayRemove(roomId),
  })
}

export const deleteRoom = async (roomId: string) => {
  await deleteDoc(doc(db, "rooms", roomId))
}

export const onVibeReceived = (roomId: string, callback: (vibe: any) => void) => {
  const vibesRef = collection(db, "vibes")
  const q = query(vibesRef, where("roomId", "==", roomId), orderBy("sentAt", "desc"))

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data()
        const vibe = {
          id: change.doc.id,
          ...data,
          sentAt: data.sentAt instanceof Timestamp ? data.sentAt.toDate() : new Date(),
        }
        callback(vibe)
      }
    })
  })
}

export const updateUserSettings = async (userId: string, settings: any) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating user settings:", error)
    throw error
  }
}

export const deleteUserAccount = async (userId: string) => {
  try {
    // Delete user document from Firestore
    const userRef = doc(db, "users", userId)
    await deleteDoc(userRef)

    // Delete user account from Firebase Authentication
    const user = auth.currentUser
    if (user) {
      await deleteUser(user)
      console.log("User account deleted successfully")
    } else {
      console.log("No user is currently signed in")
    }

    return true
  } catch (error) {
    console.error("Error deleting user account:", error)
    throw error
  }
}

// Add deleteNotification function
export const deleteNotification = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await deleteDoc(notificationRef)
    return true
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

// Add onNotificationsReceived function
export const onNotificationsReceived = (userId: string, callback: (notifications: any[]) => void) => {
  const notificationsRef = collection(db, "notifications")
  const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      }
    })
    callback(notifications)
  })
}

// Add helper function to format notification messages
function formatNotificationMessage(notification: any): string {
  switch (notification.type) {
    case "vibe":
      return `${notification.senderName || "Someone"} sent you a ${notification.vibeType} vibe`
    case "message":
      return `${notification.senderName || "Someone"} sent you a message`
    case "join":
      return `${notification.senderName || "Someone"} joined your connection`
    default:
      return notification.message || "New notification"
  }
}

// Add message retention settings type
export type MessageRetentionType = '7days' | 'afterView' | 'never'

// Add message retention settings to room
export const updateRoomMessageRetention = async (roomId: string, retentionType: MessageRetentionType) => {
  try {
    const roomRef = doc(db, "rooms", roomId)
    await updateDoc(roomRef, {
      messageRetention: retentionType,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error updating message retention:", error)
    throw error
  }
}

// Function to clean up messages based on retention settings
export const cleanupMessages = async (roomId: string) => {
  try {
    const roomRef = doc(db, "rooms", roomId)
    const roomSnap = await getDoc(roomRef)
    
    if (!roomSnap.exists()) {
      throw new Error("Room not found")
    }

    const roomData = roomSnap.data()
    const retentionType = roomData.messageRetention || 'never'

    if (retentionType === 'never') {
      return
    }

    const messagesRef = collection(db, "messages")
    const now = new Date()
    let queryRef

    if (retentionType === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      queryRef = query(
        messagesRef,
        where("roomId", "==", roomId),
        where("timestamp", "<", sevenDaysAgo)
      )
    } else if (retentionType === 'afterView') {
      queryRef = query(
        messagesRef,
        where("roomId", "==", roomId),
        where("viewed", "==", true)
      )
    }

    if (queryRef) {
      const querySnapshot = await getDocs(queryRef)
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
    }

    return true
  } catch (error) {
    console.error("Error cleaning up messages:", error)
    throw error
  }
}

// Function to mark messages as viewed
export const markMessagesAsViewed = async (roomId: string, userId: string) => {
  try {
    const messagesRef = collection(db, "messages")
    const q = query(
      messagesRef,
      where("roomId", "==", roomId),
      where("viewed", "==", false),
      where("senderId", "!=", userId)
    )

    const querySnapshot = await getDocs(q)
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        viewed: true,
        viewedAt: serverTimestamp(),
        viewedBy: arrayUnion(userId)
      })
    )

    await Promise.all(updatePromises)
    return true
  } catch (error) {
    console.error("Error marking messages as viewed:", error)
    throw error
  }
}

