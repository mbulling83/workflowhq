import type { Metadata } from 'next'
import './globals.css'
import { FeedbackWidget } from '@/components/FeedbackWidget'

export const metadata: Metadata = {
  title: 'WorkflowHQ',
  description: 'Manage your n8n workflows from anywhere.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <FeedbackWidget />
      </body>
    </html>
  )
}
