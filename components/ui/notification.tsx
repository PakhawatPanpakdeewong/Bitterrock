'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { cn } from '@/components/utils/cn'

type NotificationType = 'info' | 'success' | 'error' | 'warning'

type Notification = {
  id: number
  message: string
  type: NotificationType
}

type NotificationContextValue = {
  notify: (message: string, options?: { type?: NotificationType }) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

let idCounter = 0

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, options?: { type?: NotificationType }) => {
      const id = ++idCounter
      const type = options?.type ?? 'info'

      setNotifications((prev) => [...prev, { id, message, type }])

      window.setTimeout(() => {
        removeNotification(id)
      }, 3000)
    },
    [removeNotification]
  )

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 inset-x-0 z-50 flex flex-col items-center gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'flex min-w-[260px] max-w-sm items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg',
              'transition-all duration-200',
              {
                'border-blue-200': notification.type === 'info',
                'border-green-200': notification.type === 'success',
                'border-red-200': notification.type === 'error',
                'border-yellow-200': notification.type === 'warning',
              }
            )}
          >
            <div className="mt-0.5 text-blue-500">
              {notification.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {notification.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex-1 text-sm text-gray-900 text-center px-2">
              {notification.message}
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

