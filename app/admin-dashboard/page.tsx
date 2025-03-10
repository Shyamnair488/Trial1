"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getAllUsers, getAllRooms } from "@/lib/firebase/firestore"
import { Users, Home, Activity } from "lucide-react"

export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState(0)
  const [roomCount, setRoomCount] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await getAllUsers()
        const rooms = await getAllRooms()
        setUserCount(users.length)
        setRoomCount(rooms.length)
        setActiveUsers(users.filter((u) => u.online).length)
      } catch (error) {
        console.error("Error fetching admin data:", error)
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "There was a problem loading the admin dashboard data.",
        })
      }
    }

    if (user && user.isAdmin) {
      fetchData()
    }
  }, [user, toast])

  if (loading || !user || !user.isAdmin) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Button onClick={() => router.push("/admin/users")}>Manage Users</Button>
        <Button className="ml-4" onClick={() => router.push("/admin/rooms")}>
          Manage Rooms
        </Button>
      </div>
    </div>
  )
}

