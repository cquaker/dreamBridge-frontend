import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class 合并工具，避免重复的修饰符
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
