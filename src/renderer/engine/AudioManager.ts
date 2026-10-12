// rederer/src/engine/AudioManager.ts

export class AudioManager {
  private bgm: HTMLAudioElement | null = null
  private bgmName: string | null = null
  private voice: HTMLAudioElement | null = null
  private sfx: HTMLAudioElement | null = null

  constructor(private resolveAudio: (type: 'bgm' | 'voice' | 'sfx', name: string) => string) {}

  // ---------- BGM ----------

  playBgm(name: string | null): void {
    if (name === this.bgmName) return

    this.stopBgm()
    if (name === null) return

    const audio = new Audio(this.resolveAudio('bgm', name))
    audio.loop = true

    this.bgm = audio
    this.bgmName = name

    void audio.play().catch((error) => {
      if (this.bgm !== audio) return
      console.error(`Failed to play BGM: ${name}`, error)
    })
  }

  stopBgm(): void {
    this.bgm?.pause()
    this.bgm = null
    this.bgmName = null
  }

  // ---------- Voice ----------

  playVoice(name: string): void {
    this.stopVoice()

    const audio = new Audio(this.resolveAudio('voice', name))
    this.voice = audio

    void audio.play().catch((error) => {
      if (this.voice !== audio) return
      console.error(`Failed to play Voice: ${name}`, error)
    })
  }

  stopVoice(): void {
    this.voice?.pause()
    this.voice = null
  }

  // ---------- SFX ----------

  playSfx(name: string): void {
    this.stopSfx()

    const audio = new Audio(this.resolveAudio('sfx', name))
    this.sfx = audio

    void audio.play().catch((error) => {
      if (this.sfx !== audio) return
      console.error(`Failed to play SFX: ${name}`, error)
    })
  }

  stopSfx(): void {
    this.sfx?.pause()
    this.sfx = null
  }

  // ---------- Lifecycle ----------

  dispose(): void {
    this.stopBgm()
    this.stopVoice()
    this.stopSfx()
  }
}
