import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Fuck Doug Ford — Ontario Accountability Dashboard',
  description: 'Tracking Ontario Government bills, MPPs, and scandals that affect Toronto. ProPublica-style transparency journalism.',
  keywords: ['Ontario', 'Doug Ford', "Queen's Park", 'Toronto', 'legislature', 'bills', 'accountability'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HS9JW4JFQS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HS9JW4JFQS');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white antialiased">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
