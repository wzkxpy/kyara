// renderer/engine/AudioManager.ts

export type AudioType = 'bgm' | 'voice' | 'sfx'

export interface AudioVolumes {
  master: number
  music: number
  voice: number
  sfx: number
}

export class AudioManager {
  private bgm: HTMLAudioElement | null = null
  private voice: HTMLAudioElement | null = null
  private sfx: HTMLAudioElement | null = null

  constructor(
    private resolveAudio: (type: AudioType, name: string) => string,
    private volumes: AudioVolumes
  ) {}

  // 音量变化时同步到正在播放的音频
  setVolumes(volumes: AudioVolumes): void {
    this.volumes = volumes
    this.applyVolume(this.bgm, 'bgm')
    this.applyVolume(this.voice, 'voice')
    this.applyVolume(this.sfx, 'sfx')
  }

  private effectiveVolume(type: AudioType): number {
    const channel =
      type === 'bgm' ? this.volumes.music : type === 'voice' ? this.volumes.voice : this.volumes.sfx
    return Math.min(1, Math.max(0, this.volumes.master * channel))
  }

  private applyVolume(audio: HTMLAudioElement | null, type: AudioType): void {
    if (!audio) return
    audio.volume = this.effectiveVolume(type)
  }

  private createAudio(type: AudioType, name: string): HTMLAudioElement | null {
    try {
      const audio = new Audio(this.resolveAudio(type, name))
      audio.volume = this.effectiveVolume(type) // 起播前设定，避免首帧满音量
      return audio
    } catch (error) {
      // 清单缺少音频时只跳过播放，不中断剧情推进。
      console.error(`音频资源解析失败：${type}/${name}`, error)
      return null
    }
  }

  private releaseAudio(audio: HTMLAudioElement | null): void {
    if (!audio) return
    audio.onended = null
    audio.onerror = null
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }

  // ---------- BGM ----------

  playBgm(name: string | null): void {
    this.stopBgm()
    if (name === null) return

    const audio = this.createAudio('bgm', name)
    if (!audio) return
    audio.loop = true

    this.bgm = audio

    audio.onerror = () => {
      if (this.bgm !== audio) return
      console.error(`背景音乐加载失败：${name}`, audio.error)
      this.stopBgm()
    }
    void audio.play().catch((error) => {
      if (this.bgm !== audio) return
      console.error(`Failed to play BGM: ${name}`, error)
      this.stopBgm()
    })
  }

  stopBgm(): void {
    const audio = this.bgm
    this.bgm = null
    this.releaseAudio(audio)
  }

  // ---------- Voice ----------

  playVoice(name: string): void {
    this.stopVoice()
    const audio = this.createAudio('voice', name)
    if (!audio) return
    this.voice = audio

    audio.onended = () => {
      if (this.voice === audio) this.stopVoice()
    }
    audio.onerror = () => {
      if (this.voice !== audio) return
      console.error(`语音加载失败：${name}`, audio.error)
      this.stopVoice()
    }
    void audio.play().catch((error) => {
      if (this.voice !== audio) return
      console.error(`Failed to play Voice: ${name}`, error)
      this.stopVoice()
    })
  }

  stopVoice(): void {
    const audio = this.voice
    this.voice = null
    this.releaseAudio(audio)
  }

  // ---------- SFX ----------

  playSfx(name: string): void {
    this.stopSfx()
    const audio = this.createAudio('sfx', name)
    if (!audio) return
    this.sfx = audio

    audio.onended = () => {
      if (this.sfx === audio) this.stopSfx()
    }
    audio.onerror = () => {
      if (this.sfx !== audio) return
      console.error(`音效加载失败：${name}`, audio.error)
      this.stopSfx()
    }
    void audio.play().catch((error) => {
      if (this.sfx !== audio) return
      console.error(`Failed to play SFX: ${name}`, error)
      this.stopSfx()
    })
  }

  stopSfx(): void {
    const audio = this.sfx
    this.sfx = null
    this.releaseAudio(audio)
  }

  // ---------- Lifecycle ----------
  dispose(): void {
    this.stopBgm()
    this.stopVoice()
    this.stopSfx()
  }
}
