"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/components/auth-provider"
import { getRoom, sendVibe, onVibeReceived, removeUserFromRoom, deleteRoom } from "@/lib/firebase/firestore"
import { Heart, ArrowLeft, Clock, MessageSquare, Users, Trash2, UserMinus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { sendMessage, onMessagesReceived } from "@/lib/firebase/messages"

type RoomData = {
  id: string
  name: string
  members: string[]
  createdAt: Date
}

type Member = {
  id: string
  name: string
  online: boolean
  lastSeen?: Date
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const [room, setRoom] = useState<RoomData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isVibrating, setIsVibrating] = useState(false)
  const [vibeType, setVibeType] = useState<"short" | "long" | null>(null)
  const [lastVibe, setLastVibe] = useState<Date | null>(null)
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && params.id) {
      const fetchRoom = async () => {
        try {
          const roomData = await getRoom(params.id)
          setRoom(roomData)

          // Fetch member data here
          // setMembers(...)
        } catch (error) {
          console.error("Error fetching room:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load the connection room.",
          })
          router.push("/dashboard")
        }
      }

      fetchRoom()

      // Set up real-time listener for vibes
      const unsubscribe = onVibeReceived(params.id, (vibe) => {
        if (vibe.senderId !== user.uid) {
          handleReceiveVibe(vibe)
        }
      })

      const unsubscribeMessages = onMessagesReceived(params.id, (newMessages) => {
        setMessages(newMessages)
      })

      return () => {
        unsubscribe()
        unsubscribeMessages()
      }
    }
  }, [user, params.id, router, toast])

  const handleSendVibe = async (type: "short" | "long") => {
    if (!user || !room) return

    setVibeType(type)
    setIsVibrating(true)

    try {
      const senderName = user.displayName || user.email || "Someone"
      await sendVibe(room.id, user.uid, type, senderName)

      // Vibrate the device if supported
      if (navigator.vibrate) {
        if (type === "short") {
          navigator.vibrate(300)
        } else {
          navigator.vibrate([300, 100, 500])
        }
      }

      setLastVibe(new Date())

      toast({
        title: "Vibe sent!",
        description: "Your loved ones will feel your presence.",
      })
    } catch (error) {
      console.error("Error sending vibe:", error)
      toast({
        variant: "destructive",
        title: "Failed to send vibe",
        description: "There was an error sending your vibe. Please try again.",
      })
    } finally {
      setTimeout(
        () => {
          setIsVibrating(false)
          setVibeType(null)
        },
        type === "short" ? 1000 : 2000,
      )
    }
  }

  const handleReceiveVibe = (vibe: any) => {
    const type = vibe.type
    const senderName = vibe.senderName || "Someone"

    setVibeType(type)
    setIsVibrating(true)

    // Vibrate the device if supported
    if (navigator.vibrate) {
      if (type === "short") {
        navigator.vibrate(300)
      } else {
        navigator.vibrate([300, 100, 500])
      }
    }

    setLastVibe(new Date())

    toast({
      title: `${senderName} sent a ${type} vibe!`,
      description: `${senderName} is thinking of you.`,
    })

    setTimeout(
      () => {
        setIsVibrating(false)
        setVibeType(null)
      },
      type === "short" ? 1000 : 2000,
    )
  }

  const handleRemoveUser = async (userId: string) => {
    if (room && confirm("Are you sure you want to remove this user from the connection?")) {
      await removeUserFromRoom(userId, room.id)
      // Refresh room data or update state
    }
  }

  const handleDeleteRoom = async () => {
    if (room && confirm("Are you sure you want to delete this connection? This action cannot be undone.")) {
      await deleteRoom(room.id)
      router.push("/dashboard")
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !room || !newMessage.trim()) return

    try {
      await sendMessage(room.id, user.uid, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
      })
    }
  }

  const getMemberName = (memberId: string) => {
    const member = room?.members?.find((m) => m.id === memberId)
    return member?.displayName || member?.email || "Unknown"
  }

  if (loading || !room) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <Heart className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-lg">Loading connection...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold truncate">{room.name}</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 p-4 md:p-8 gap-8">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="text-sm text-muted-foreground flex flex-wrap items-center justify-center gap-1">
              <Users className="h-4 w-4" />
              <span>{room.members?.length || 0} connected</span>
              {lastVibe && (
                <>
                  <span className="mx-1">•</span>
                  <Clock className="h-4 w-4" />
                  <span>Last vibe: {formatTimeAgo(lastVibe)}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {room.members?.map((member) => (
                <Card key={member.id} className="px-3 py-2 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${member.online ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="truncate max-w-[120px]">{member.displayName || member.email || member.id}</span>
                  {!member.online && member.lastSeen && (
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(member.lastSeen)}</span>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className={`absolute inset-0 rounded-full bg-primary/20 animate-ping ${isVibrating ? "opacity-100" : "opacity-0"}`}
              style={{
                animationDuration: vibeType === "short" ? "1s" : "2s",
                transition: "opacity 0.2s ease-in-out",
              }}
            />
            <Button
              size="lg"
              className="h-32 w-32 md:h-40 md:w-40 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
              onClick={() => handleSendVibe("short")}
            >
              <Heart className={`h-12 w-12 md:h-16 md:w-16 ${isVibrating ? "animate-pulse" : ""}`} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" className="gap-2" onClick={() => handleSendVibe("short")}>
              Short Vibe
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleSendVibe("long")}>
              Long Vibe
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => router.push(`/room/${params.id}/messages`)}>
              <MessageSquare className="h-4 w-4" />
              Messages
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleRemoveUser("someUserId")}>
              <UserMinus className="h-4 w-4 mr-2" />
              Remove User
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoom}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Connection
            </Button>
          </div>
        </div>
        <div className="mt-8 p-4">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          <div className="bg-background border rounded-lg p-4 h-64 overflow-y-auto mb-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-2 ${message.senderId === user?.uid ? "text-right" : ""}`}>
                <div className="flex flex-col">
                  <span
                    className={`text-xs text-muted-foreground ${message.senderId === user?.uid ? "text-right" : ""}`}
                  >
                    {message.senderId === user?.uid ? "You" : getMemberName(message.senderId)}
                    {message.sentAt && ` • ${formatTime(message.sentAt)}`}
                  </span>
                  <span
                    className={`${
                      message.senderId === user?.uid
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-secondary text-secondary-foreground"
                    } rounded-lg px-3 py-2 inline-block mt-1 max-w-[80%] break-words`}
                  >
                    {message.content}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

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

