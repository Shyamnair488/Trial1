'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MessageRetentionType, updateRoomMessageRetention } from '@/lib/firebase/firestore'
import { useState } from 'react'
import { toast } from 'sonner'

interface MessageRetentionSettingsProps {
  roomId: string
  currentRetention: MessageRetentionType
}

export function MessageRetentionSettings({ roomId, currentRetention }: MessageRetentionSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRetention, setSelectedRetention] = useState<MessageRetentionType>(currentRetention)

  const handleSave = async () => {
    try {
      await updateRoomMessageRetention(roomId, selectedRetention)
      toast.success('Message retention settings updated')
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating retention settings:', error)
      toast.error('Failed to update settings')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Message Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message Retention Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedRetention}
            onValueChange={(value) => setSelectedRetention(value as MessageRetentionType)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="never" id="never" />
              <Label htmlFor="never">Never delete messages</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="7days" id="7days" />
              <Label htmlFor="7days">Delete messages after 7 days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="afterView" id="afterView" />
              <Label htmlFor="afterView">Delete messages after viewing</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 