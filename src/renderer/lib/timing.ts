// src/renderer/lib/timing.ts

// 文字逐字显示的单字间隔 ms，textSpeed 1-100 指数映射：每档约 +3.5% 速度，滑杆手感均匀
const SLOWEST_INTERVAL_MS = 150 // speed=1：约 6.7 字/秒
const FASTEST_INTERVAL_MS = 5 // speed=100：约 200 字/秒

export function textCharIntervalMs(speed: number): number {
  const value = Math.min(100, Math.max(1, speed))
  return SLOWEST_INTERVAL_MS * (FASTEST_INTERVAL_MS / SLOWEST_INTERVAL_MS) ** ((value - 1) / 99)
}
