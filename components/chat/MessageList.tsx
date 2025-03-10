'use client'

import { Message } from '@/types/chat'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { useEffect, useRef, useState } from 'react'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [groupedMessages, setGroupedMessages] = useState<{ [key: string]: Message[] }>({})

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Group messages by date
  useEffect(() => {
    const grouped = messages.reduce((acc, message) => {
      const date = new Date(message.timestamp)
      let dateKey: string

      if (isToday(date)) {
        dateKey = 'Today'
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday'
      } else {
        dateKey = format(date, 'MMMM d, yyyy')
      }

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(message)
      return acc
    }, {} as { [key: string]: Message[] })

    setGroupedMessages(grouped)
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          {/* Date header */}
          <div className="flex justify-center">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-500 dark:text-gray-400">
              {date}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const isCurrentUser = message.senderId === currentUserId
              const showTime = index === dateMessages.length - 1 || 
                             !isSameDay(new Date(message.timestamp), new Date(dateMessages[index + 1].timestamp))

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {showTime && (
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
} 