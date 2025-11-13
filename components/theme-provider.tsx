"use client"

import { type ReactNode, useEffect, useState } from "react"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 读取 html.dark 以同步服务端/客户端的初始主题
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    // toggled 后立即写入 html 标签，Tailwind dark 选择器即可生效
    const html = document.documentElement
    html.classList.toggle("dark")
    setIsDark(!isDark)
  }

  if (!mounted) return <>{children}</>

  return <div className="flex flex-col min-h-screen">{children}</div>
}

export function useTheme() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 只在客户端读取一次，避免 SSR 命中 window
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    html.classList.toggle("dark")
    setIsDark((prev) => !prev)
  }

  return { isDark, toggleTheme }
}
