import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/query-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { ClinicProvider } from "@/providers/clinic-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Turnera",
  description: "Medical appointment scheduling system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>
            <ClinicProvider>
              <Toaster />
              {children}
            </ClinicProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
