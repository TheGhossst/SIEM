'use client'

import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'

const DynamicAdminPanel = dynamic(() => import('@/components/AdminPanel').then(mod => mod.AdminPanel), { ssr: false })

export function DynamicAdminPanelWrapper() {
  const { user } = useAuth()

  if (user && user.role === 'admin') {
    return <DynamicAdminPanel />
  }

  return null
}