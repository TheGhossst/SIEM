'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { RecentActivity } from './RecentActivity'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface TrafficData {
  timestamp: Timestamp;
  volume: number;
}

interface AlertData {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'active' | 'resolved';
}

export default function Dashboard() {
  const [totalEvents, setTotalEvents] = useState<number>(0)
  const [activeAlerts, setActiveAlerts] = useState<number>(0)
  const [trafficData, setTrafficData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  }>({
    labels: [],
    datasets: [
      {
        label: 'Network Traffic',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  })
  const [alertSeverityData, setAlertSeverityData] = useState<{
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  }>({
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#FF6384', '#FF9F40', '#FFCD56', '#4BC0C0'],
      },
    ],
  })

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), orderBy('timestamp', 'desc'), limit(100))
    const alertsQuery = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(100))
    const trafficQuery = query(collection(db, 'traffic'), orderBy('timestamp', 'desc'), limit(7))

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      setTotalEvents(snapshot.size)
    })

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const activeAlertsCount = snapshot.docs.filter(doc => doc.data().status === 'active').length
      setActiveAlerts(activeAlertsCount)

      const severityCounts: Record<'Critical' | 'High' | 'Medium' | 'Low', number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
      snapshot.docs.forEach(doc => {
        const data = doc.data() as AlertData
        if (data.severity in severityCounts) {
          severityCounts[data.severity]++
        }
      })

      setAlertSeverityData(prevData => ({
        ...prevData,
        datasets: [{
          ...prevData.datasets[0],
          data: Object.values(severityCounts)
        }]
      }))
    })

    const unsubscribeTraffic = onSnapshot(trafficQuery, (snapshot) => {
      const labels: string[] = []
      const data: number[] = []
      snapshot.docs.reverse().forEach(doc => {
        const trafficData = doc.data() as TrafficData
        labels.push(trafficData.timestamp.toDate().toLocaleDateString())
        data.push(trafficData.volume)
      })
      setTrafficData({
        labels,
        datasets: [
          {
            label: 'Network Traffic',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      })
    })

    return () => {
      unsubscribeEvents()
      unsubscribeAlerts()
      unsubscribeTraffic()
    }
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">SIEM Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Events</h2>
          <p className="text-4xl font-bold">{totalEvents}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Active Alerts</h2>
          <p className="text-4xl font-bold">{activeAlerts}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 col-span-2">
          <h2 className="text-xl font-semibold mb-2">Network Traffic</h2>
          <Bar data={trafficData} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Alert Severity Distribution</h2>
          <Pie data={alertSeverityData} />
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}