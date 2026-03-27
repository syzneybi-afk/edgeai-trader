import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'EdgeAI Trader Mobile',
  description: 'AI-powered trading signals on the go',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EdgeAI',
  },
  applicationName: 'EdgeAI Trader',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="touch-pan-x touch-pan-y">
      {children}
    </div>
  )
}
