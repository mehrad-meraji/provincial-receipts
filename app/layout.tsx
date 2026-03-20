import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
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
  metadataBase: new URL('https://fuckdougford.ca'),
  title: {
    template: '%s | Fuck Doug Ford',
    default: 'Fuck Doug Ford — Ontario Accountability Dashboard',
  },
  description: "Tracking Doug Ford's Ontario government: documented scandals, $46B+ in public service cuts, budget data, MPP votes, and the real cost to Ontarians. Independent civic transparency.",
  keywords: [
    'Doug Ford', 'Ontario government', "Queen's Park", 'Toronto', 'Ontario budget',
    'Ontario scandals', 'MPP', 'Ford government cuts', 'Ontario accountability',
    'Ontario transparency', 'Ontario legislature', 'Conservative Ontario',
    'Ford scandals', 'Ontario public services',
  ],
  authors: [{ name: 'fuckdougford.ca', url: 'https://fuckdougford.ca' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Fuck Doug Ford',
    title: 'Fuck Doug Ford — Ontario Accountability Dashboard',
    description: "Tracking Doug Ford's Ontario government: documented scandals, $46B+ in public service cuts, MPP votes, and the real cost to Ontarians.",
    url: 'https://fuckdougford.ca',
    locale: 'en_CA',
  },
  twitter: {
    card: 'summary',
    title: 'Fuck Doug Ford — Ontario Accountability Dashboard',
    description: "Tracking Doug Ford's Ontario government: documented scandals, $46B+ in public service cuts, and the real cost to Ontarians.",
  },
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
        {children}
      </body>
    </html>
  )
}
