import Dashboard from '@/components/Dashboard'
import LogManagement from '@/components/LogManagement'
import AlertSystem from '@/components/AlertSystem'
import ThreatDetection from '@/components/ThreatDetection'
import ThreatIntelligence from '@/components/ThreatIntelligence'
import Loading from '@/components/loading'
import { Suspense } from 'react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
      <div className="w-full mt-8">
        <Suspense fallback={<Loading />}>
          <LogManagement />
        </Suspense>
      </div>
      <div className="w-full mt-8">
        <Suspense fallback={<Loading />}>
          <AlertSystem />
        </Suspense>
      </div>
      <div className="w-full mt-8">
        <Suspense fallback={<Loading />}>
          <ThreatDetection />
        </Suspense>
      </div>
      <div className="w-full mt-8">
        <Suspense fallback={<Loading />}>
          <ThreatIntelligence />
        </Suspense>
      </div>
    </main>
  )
}