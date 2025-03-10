"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getRoom, joinRoom } from "@/lib/firebase/firestore"
import { Heart, ArrowRight, Users } from "lucide-react"

export default function JoinRoomPage({ params }: { params: { id: string } }) {
  const [roomName, setRoomName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomData = await getRoom(params.id)
        setRoomName(roomData.name)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching room:", error)
        toast({
          variant: "destructive",
          title: "Invalid invitation",
          description: "This connection room doesn't exist or has been deleted.",
        })
        router.push("/dashboard")
      }
    }

    if (params.id) {
      fetchRoom()
    }
  }, [params.id, router, toast])

  const handleJoinRoom = async () => {
    if (!user) {
      router.push(`/login?redirect=/join/${params.id}`)
      return
    }

    setIsJoining(true)
    try {
      await joinRoom(params.id, user.uid)
      toast({
        title: "Joined successfully!",
        description: "You've joined the connection room.",
      })
      router.push(`/room/${params.id}`)
    } catch (error) {
      console.error("Error joining room:", error)
      toast({
        variant: "destructive",
        title: "Failed to join",
        description: "There was an error joining this connection. Please try again.",
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Heart className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-lg">Loading invitation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2">
        <Heart className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">VibeConnect</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Connection</CardTitle>
          <CardDescription>You've been invited to join a connection on VibeConnect</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 py-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{roomName}</h2>
            <p className="text-muted-foreground mt-1">Join this connection to send and receive vibes</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleJoinRoom} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join Connection"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {!user && (
            <p className="text-center text-sm text-muted-foreground">
              You'll need to sign in or create an account to join
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

