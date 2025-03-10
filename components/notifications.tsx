"use client"

import { useState, useEffect } from "react"
import { Bell, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  onNotificationsReceived,
} from "@/lib/firebase/firestore"

type Notification = {
  id: string
  message: string
  read: boolean
  createdAt: Date
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        const userNotifications = await getNotifications(user.uid)
        setNotifications(userNotifications)
      }
    }

    fetchNotifications()

    // Set up real-time listener for new notifications
    if (user) {
      const unsubscribe = onNotificationsReceived(user.uid, (newNotifications) => {
        setNotifications(newNotifications)
      })

      return () => unsubscribe()
    }
  }, [user])

  const handleMarkAsRead = async (notificationId: string) => {
    if (user) {
      await markNotificationAsRead(user.uid, notificationId)
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (user) {
      await deleteNotification(notificationId)
      setNotifications(notifications.filter((n) => n.id !== notificationId))
    }
  }

  const handleClearAllRead = async () => {
    if (user) {
      const readNotifications = notifications.filter((n) => n.read)
      for (const notification of readNotifications) {
        await deleteNotification(notification.id)
      }
      setNotifications(notifications.filter((n) => !n.read))
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notifications.some((n) => n.read) && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleClearAllRead}>
              Clear read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem>No notifications</DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-2">
              <div className="flex w-full justify-between">
                <span className={notification.read ? "text-muted-foreground" : "font-semibold"}>
                  {notification.message || formatNotificationMessage(notification)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNotification(notification.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex justify-between w-full mt-1">
                <span className="text-xs text-muted-foreground">
                  {notification.createdAt && formatTimeAgo(notification.createdAt)}
                </span>
                {!notification.read && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsRead(notification.id)
                    }}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Add this helper function
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
}

function formatNotificationMessage(notification: any): string {
  if (notification.message) return notification.message

  switch (notification.type) {
    case "vibe":
      return `${notification.senderName || "Someone"} sent you a ${notification.vibeType || "new"} vibe`
    case "message":
      return `${notification.senderName || "Someone"} sent you a message`
    case "join":
      return `${notification.senderName || "Someone"} joined your connection`
    default:
      return "New notification"
  }
}

