import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

import { Outfit, IBM_Plex_Serif, Inter as V0_Font_Inter, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// 初始化各类字体，确保生成的 class 能被 Next.js 内联，避免闪烁
const _inter = V0_Font_Inter({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

// 额外加载带 variable 的字体，便于在 CSS 中通过自定义属性引用
const outfitFont = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
})

const ibmPlexSerifFont = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-serif",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "留学规划",
    template: "%s | 留学规划",
  },
  description: "智能留学规划平台，提供学校数据查询、学习方案生成和 AI 辅助教育规划服务",
  keywords: [
    "留学规划",
    "教育规划",
    "学校数据",
    "学习方案",
    "AI 教育",
    "DreamBridge",
  ],
  authors: [{ name: "DreamBridge Team" }],
  creator: "DreamBridge",
  publisher: "DreamBridge",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "留学规划",
    description: "智能留学规划平台，提供学校数据查询、学习方案生成和 AI 辅助教育规划服务",
    siteName: "留学规划",
  },
  twitter: {
    card: "summary_large_image",
    title: "留学规划",
    description: "智能留学规划平台，提供学校数据查询、学习方案生成和 AI 辅助教育规划服务",
    creator: "@dreambridge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 在 html 标签上挂载字体变量，并开启 suppressHydrationWarning 以避免暗色模式初次渲染抖动
    <html lang="zh" suppressHydrationWarning className={`${outfitFont.variable} ${ibmPlexSerifFont.variable}`}>
      {/* 将 Analytics 等全局 Provider 注入 body 之内，确保所有页面共享同一布局 */}
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
