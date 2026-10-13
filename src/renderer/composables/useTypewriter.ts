// src/renderer/composables/useTypewriter.ts

import { ref, onScopeDispose, type Ref } from 'vue'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTypewriter(intervalMs: Ref<number>) {
  const displayedText = ref('') // 当前界面显示的文本
  const isTyping = ref(false)

  let fullText = '' // 完整目标文本
  let characters: string[] = [] // 拆成字符数组
  let index = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  // 清理计时器
  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  // 立即显示全部文本
  function finish(): void {
    clearTimer()
    displayedText.value = fullText
    index = characters.length
    isTyping.value = false
  }

  // 逐字显示文本
  function tick(): void {
    if (index >= characters.length) {
      isTyping.value = false
      return
    }
    displayedText.value += characters[index]
    index++
    if (index < characters.length) {
      timer = setTimeout(tick, Math.max(0, intervalMs.value))
    } else {
      isTyping.value = false
      timer = null
    }
  }

  // 开始打一段新文本
  function start(text: string): void {
    clearTimer()

    fullText = text
    characters = Array.from(text)
    index = 0

    displayedText.value = ''
    isTyping.value = characters.length > 0

    if (isTyping.value) {
      timer = setTimeout(tick, Math.max(0, intervalMs.value))
    }
  }

  // 停止但保留已显示内容
  function stop(): void {
    clearTimer()
    isTyping.value = false
  }
  // 组件卸载时
  onScopeDispose(stop)

  return {
    displayedText,
    isTyping,
    start,
    finish
  }
}
