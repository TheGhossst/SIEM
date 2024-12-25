import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { DynamicAdminPanelWrapper } from '@/components/DynamicAdminPanelWrapper'
import Loading from '@/components/loading'
import React from 'react';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SIEM System',
  description: 'Networking Security Information and Event Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              <React.Suspense fallback={<Loading />}>
                {children}
              </React.Suspense>
            </main>
            <DynamicAdminPanelWrapper />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}