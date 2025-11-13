import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
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
  title: "学习方案工作流 Agent",
  description: "AI-powered learning plan workflow system",
  generator: "v0.app",
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
        <Analytics />
      </body>
    </html>
  )
}
