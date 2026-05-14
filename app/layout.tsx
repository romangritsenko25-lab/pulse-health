import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] })
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['italic'],
  weight: ['700'],
})

export const metadata: Metadata = {
  title: 'Metanoia AI',
  description: 'Глубокий AI-опрос и структурированный анализ для разговора со специалистом',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
          <Script id="posthog" strategy="afterInteractive">{`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}', {api_host:'https://eu.posthog.com',person_profiles:'identified_only'})
          `}</Script>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  )
}
