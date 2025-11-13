"use client"
import { Home } from "@/components/pages/home"
import { ThemeProvider } from "@/components/theme-provider"

export default function Page() {
  // Home 页面依赖大量交互逻辑，因此放在 ThemeProvider 中以共享暗色模式状态
  return (
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  )
}
