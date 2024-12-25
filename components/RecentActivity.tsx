'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity, AlertTriangle } from 'lucide-react'

type ActivityItem = {
  id: string
  type: 'event' | 'alert'
  title: string
  timestamp: Date
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), orderBy('timestamp', 'desc'), limit(5))
    const alertsQuery = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(5))

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const newEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'event' as const,
        title: doc.data().title,
        timestamp: doc.data().timestamp.toDate(),
      }))
      setActivities(prev => [...prev, ...newEvents])
    })

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const newAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'alert' as const,
        title: doc.data().title,
        timestamp: doc.data().timestamp.toDate(),
        severity: doc.data().severity,
      }))
      setActivities(prev => [...prev, ...newAlerts])
    })

    return () => {
      unsubscribeEvents()
      unsubscribeAlerts()
    }
  }, [])

  const sortedActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)

  return (
    <div className="space-y-4">
      {sortedActivities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-3">
          {activity.type === 'event' ? (
            <Activity className="h-5 w-5 text-blue-500" />
          ) : (
            <AlertTriangle className={`h-5 w-5 ${
              activity.severity === 'critical' ? 'text-red-500' :
              activity.severity === 'high' ? 'text-orange-500' :
              activity.severity === 'medium' ? 'text-yellow-500' :
              'text-green-500'
            }`} />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-gray-500">
              {activity.timestamp.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

