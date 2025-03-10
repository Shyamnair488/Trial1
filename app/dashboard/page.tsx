"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/components/auth-provider"
import { createRoom, getRooms, joinRoom } from "@/lib/firebase/firestore"
import { Heart, Plus, Users, Copy, QrCode, Share2 } from "lucide-react"

type Room = {
  id: string
  name: string
  members: string[]
  createdAt: Date
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [joinCode, setJoinCode] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      const fetchRooms = async () => {
        try {
          console.log("Fetching rooms for user:", user.uid)
          const userRooms = await getRooms(user.uid)
          console.log("Fetched rooms:", userRooms)
          setRooms(userRooms)
        } catch (error) {
          console.error("Error fetching rooms:", error)
          toast({
            variant: "destructive",
            title: "Error loading connections",
            description: "There was a problem loading your connections. Please try again.",
          })
        }
      }

      fetchRooms()
    }
  }, [user, toast])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      console.log("Creating room:", newRoomName)
      const roomId = await createRoom(newRoomName, user.uid)
      setInviteCode(roomId)
      toast({
        title: "Room created!",
        description: "Your new connection room has been created.",
      })

      // Add the new room to the list
      const newRoom: Room = {
        id: roomId,
        name: newRoomName,
        members: [user.uid],
        createdAt: new Date(),
      }

      setRooms([...rooms, newRoom])
      setNewRoomName("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        variant: "destructive",
        title: "Failed to create room",
        description: "There was an error creating your room. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`)
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard.",
    })
  }

  const handleShareRoom = (roomId: string) => {
    const inviteLink = `${window.location.origin}/join/${roomId}`
    navigator.clipboard.writeText(inviteLink)
    toast({
      title: "Invite link copied",
      description: "The invite link has been copied to your clipboard.",
    })
  }

  const handleJoinConnection = async () => {
    if (!joinCode.trim() || !user) return

    try {
      await joinRoom(joinCode.trim(), user.uid)
      toast({
        title: "Joined connection",
        description: "You have successfully joined the connection.",
      })
      setJoinCode("")
      // Refresh rooms list
      const userRooms = await getRooms(user.uid)
      setRooms(userRooms)
    } catch (error) {
      console.error("Error joining connection:", error)
      toast({
        variant: "destructive",
        title: "Failed to join connection",
        description: "There was an error joining the connection. Please check the code and try again.",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <Heart className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-lg">Loading your connections...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex gap-2 mb-4">
          <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter connection code" />
          <Button onClick={handleJoinConnection}>Join Connection</Button>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Connections</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Connection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new connection</DialogTitle>
                <DialogDescription>
                  Give your connection a name and create a private room to connect with your loved ones.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Connection Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Family, Partner, Best Friend"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Connection"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {inviteCode && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Share your connection</CardTitle>
              <CardDescription>Invite others to join your new connection room</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Input value={`${window.location.origin}/join/${inviteCode}`} readOnly />
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QrCode className="h-32 w-32 text-primary" />
                  <p className="text-center text-sm mt-2">Scan to join</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => setInviteCode("")}>
                Done
              </Button>
            </CardFooter>
          </Card>
        )}

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="rounded-full bg-primary/10 p-6">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">No connections yet</h2>
            <p className="text-center text-muted-foreground max-w-md">
              Create your first connection to start sending vibes to your loved ones.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Connection
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{room.name}</CardTitle>
                  <CardDescription>
                    {room.members.length} {room.members.length === 1 ? "member" : "members"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, room.members.length))].map((_, i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background"
                      >
                        <span className="text-xs font-medium">U{i + 1}</span>
                      </div>
                    ))}
                    {room.members.length > 3 && (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                        <span className="text-xs font-medium">+{room.members.length - 3}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 pt-2 flex justify-between">
                  <Button variant="default" onClick={() => router.push(`/room/${room.id}`)}>
                    Open Connection
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleShareRoom(room.id)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

