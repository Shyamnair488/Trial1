"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { deleteUserAccount, updateUserSettings } from "@/lib/firebase/firestore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { signOut } from "@/lib/firebase/auth"

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSettingsChange = async (setting: string, value: boolean) => {
    if (!user) return

    try {
      await updateUserSettings(user.uid, { [setting]: value })
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your settings. Please try again.",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      await deleteUserAccount(user.uid)
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      })
      // Sign out and redirect to home page
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "There was an error deleting your account. Please try again.",
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">Receive email notifications</span>
            </Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked)
                handleSettingsChange("emailNotifications", checked)
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span>Push Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">Receive push notifications</span>
            </Label>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={(checked) => {
                setPushNotifications(checked)
                handleSettingsChange("pushNotifications", checked)
              }}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our
                  servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Yes, I want to delete my account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Final confirmation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please confirm once more that you want to permanently delete your account. All your data will be
                        lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount}>Permanently Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}

