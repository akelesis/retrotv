import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL, authHeaders } from '../api/api'

interface Channel {
  id: string
  name: string
  abbr?: string
  color?: string
  textColor?: string
}

interface PlaybackInfo {
  program_start_time: string
  current_time: string
  elapsed_seconds: number
  elapsed_minutes: number
  remaining_seconds: number
  remaining_minutes: number
  progress_percent: number
  seek_to_seconds: number
}

interface NowPlayingResponse {
  program: {
    id: string
    title: string
    source_type?: string
    source_url?: string
  }
  schedule: {
    id: string
    start_time: string
    end_time: string
  }
  playback: PlaybackInfo
}

export default function PlayerScreen(): JSX.Element {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(true)
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelIndex, setChannelIndex] = useState(0)
  const [nowPlaying, setNowPlaying] = useState<NowPlayingResponse | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [catalogUrl, setCatalogUrl] = useState<string | null>(null)
  const [muted, setMuted] = useState(true)
  const currentProgramIdRef = useRef<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const currentChannel = channels[channelIndex] ?? null

  // Fetch channels
  useEffect(() => {
    fetch(`${API_URL}/channels`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: Channel[]) => setChannels(data))
      .catch(() => {})
  }, [])

  // Fetch now-playing when channel changes + poll every 30s
  useEffect(() => {
    if (!currentChannel) {
      setNowPlaying(null)
      setEmbedUrl(null)
      setCatalogUrl(null)
      currentProgramIdRef.current = null
      return
    }

    const fetchNow = () => {
      fetch(`${API_URL}/channels/${currentChannel.id}/schedule/now-playing`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then((data: NowPlayingResponse) => {
          setNowPlaying(data)
          // Só recria o player quando o programa muda
          const newProgramId = data.program?.id ?? null
          if (newProgramId !== currentProgramIdRef.current) {
            currentProgramIdRef.current = newProgramId
            if (data.program?.source_type === 'youtube') {
              setCatalogUrl(null)
              setEmbedUrl(getYoutubeEmbedUrl(data.program?.source_url, data.playback?.seek_to_seconds))
            } else {
              setEmbedUrl(null)
              setCatalogUrl(data.program?.source_url ?? null)
            }
          }
        })
        .catch(() => {
          setNowPlaying(null)
          setEmbedUrl(null)
          setCatalogUrl(null)
          currentProgramIdRef.current = null
        })
    }

    fetchNow()
    const interval = setInterval(fetchNow, 30_000)
    return () => clearInterval(interval)
  }, [currentChannel])

  const changeChannel = useCallback((dir: 1 | -1) => {
    if (channels.length === 0) return
    setChannelIndex(prev => (prev + dir + channels.length) % channels.length)
  }, [channels])

  function formatTime(t: string) {
    return t.substring(0, 5)
  }

  function getYoutubeEmbedUrl(url?: string, seekSeconds?: number): string | null {
    if (!url) return null
    let videoId: string | null = null
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1)
      } else if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || u.pathname.split('/embed/')[1] || null
      }
    } catch { /* ignore */ }
    if (!videoId) return null
    const startParam = seekSeconds && seekSeconds > 0 ? `&start=${seekSeconds}` : ''
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&origin=${window.location.origin}${startParam}`
  }

  function postToPlayer(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      'https://www.youtube.com'
    )
  }

  function toggleMute() {
    const newMuted = !muted
    setMuted(newMuted)
    // YouTube: via postMessage
    if (embedUrl) {
      postToPlayer(newMuted ? 'mute' : 'unMute')
    }
    // Catalog/S3: via HTMLVideoElement
    if (videoRef.current) {
      videoRef.current.muted = newMuted
    }
  }

  function handleVideoLoaded() {
    if (!videoRef.current || !nowPlaying?.playback) return
    videoRef.current.currentTime = nowPlaying.playback.seek_to_seconds
    videoRef.current.play().catch(() => {})
  }

  // Auto-unmute 1s após o player carregar (só funciona se o usuário já interagiu com a página)
  useEffect(() => {
    if (!embedUrl && !catalogUrl) return
    const timer = setTimeout(() => {
      if (embedUrl) {
        postToPlayer('unMute')
      }
      if (videoRef.current) {
        videoRef.current.muted = false
      }
      setMuted(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [embedUrl, catalogUrl])

  return (
    <div className="relative flex h-screen w-full flex-col bg-black overflow-hidden select-none">
      {/* Video Layer */}
      {embedUrl ? (
        <>
          <iframe
            ref={iframeRef}
            className="absolute inset-0 z-0 w-full h-full"
            src={embedUrl}
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ border: 0 }}
          />
          {/* Overlay para bloquear interação (impede pausa/clique no player) */}
          <div className="absolute inset-0 z-[1]" />
        </>
      ) : catalogUrl ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 z-0 w-full h-full object-cover"
            src={catalogUrl}
            autoPlay
            muted
            onLoadedMetadata={handleVideoLoaded}
          />
          {/* Overlay para bloquear interação */}
          <div className="absolute inset-0 z-[1]" />
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-black" />
      )}

      {/* CRT Effects Layer */}
      <div className="absolute inset-0 z-10 crt-overlay opacity-40" />
      <div className="absolute inset-0 z-10 crt-curve border-[20px] border-black rounded-[40px] pointer-events-none" />

      {/* VCR OSD: Channel Indicator (Top Right) */}
      <div className="absolute top-8 right-10 z-20 text-retro-green osd-text text-4xl font-bold tracking-widest opacity-90">
        CH {currentChannel?.abbr ?? currentChannel?.id?.substring(0, 4) ?? '--'}
      </div>

      {/* VCR OSD: Play Status (Top Left) */}
      <div className="absolute top-8 left-10 z-20 flex items-center gap-2 text-white osd-text text-xl opacity-90">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          play_arrow
        </span>
        <span>PLAY</span>
      </div>

      {/* Quick Menu (Left Overlay) */}
      <div
        className={`absolute inset-y-0 left-0 z-[45] w-11/12 sm:w-80 vcr-blue border-r border-white/20 p-6 flex flex-col justify-center gap-8 shadow-2xl backdrop-blur-sm transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-2">
          <p className="text-retro-yellow osd-text text-sm font-bold tracking-tighter opacity-70">CURRENT CHANNEL</p>
          <h1 className="text-white osd-text text-3xl font-bold">
            {currentChannel ? `${currentChannel.abbr ?? currentChannel.name.substring(0, 3)} - ${currentChannel.name}` : '-- - SEM SINAL'}
          </h1>
        </div>

        <div className="space-y-6">
          {nowPlaying ? (
            <div className="relative group">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-retro-yellow rounded-full" />
              <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-retro-yellow osd-text text-xs font-bold">NOW PLAYING</span>
                  <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                </div>
                <p className="text-white osd-text text-xl font-bold">{nowPlaying.program?.title ?? '(Sem título)'}</p>
                <p className="text-white/60 text-xs mt-1">
                  {formatTime(nowPlaying.schedule?.start_time ?? '')} - {formatTime(nowPlaying.schedule?.end_time ?? '')}
                </p>
                {nowPlaying.playback && (
                  <>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-retro-yellow rounded-full transition-all duration-1000"
                        style={{ width: `${nowPlaying.playback.progress_percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-white/50 text-[10px]">{nowPlaying.playback.elapsed_minutes}m</span>
                      <span className="text-white/50 text-[10px]">-{nowPlaying.playback.remaining_minutes}m</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
              <p className="text-white/40 osd-text text-sm italic">Nenhuma programação disponível.</p>
            </div>
          )}
        </div>

        {/* Remote Navigation Tooltip */}
        <div className="mt-auto border-t border-white/20 pt-6">
          <div className="flex items-center gap-4 text-retro-yellow/80 text-xs font-bold uppercase">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-lg">expand_less</span>
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </div>
            <span>CHANGE CHANNEL</span>
          </div>
          <button onClick={() => navigate('/guide')} className="mt-4 flex items-center gap-4 text-white/80 text-xs font-bold uppercase hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">menu</span>
            <span>TV GUIDE</span>
          </button>
          <button onClick={() => navigate('/manager')} className="mt-2 flex items-center gap-4 text-white/80 text-xs font-bold uppercase hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">settings_input_component</span>
            <span>CHANNELS</span>
          </button>
          <button onClick={() => setMenuOpen(false)} className="mt-2 flex items-center gap-4 text-white/80 text-xs font-bold uppercase hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">chevron_left</span>
            <span>CLOSE MENU</span>
          </button>
        </div>
      </div>

      {/* OSD Bottom Bar */}
      <div className="absolute bottom-10 left-0 right-0 z-20 px-10 flex justify-between items-end">
        <div className="text-white/50 osd-text text-xs">
          SP-AUTO<br />
          HI-FI STEREO
        </div>
        <button
          onClick={toggleMute}
          className="flex items-center gap-2 bg-black/60 border border-white/20 rounded-full px-4 py-2 text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {muted ? 'volume_off' : 'volume_up'}
          </span>
          <span className="osd-text text-xs font-bold uppercase">
            {muted ? 'SOM OFF' : 'SOM ON'}
          </span>
        </button>
      </div>

      {/* Mobile Controls */}
      <div className="absolute inset-0 z-40 flex items-center justify-between px-4 pointer-events-none">
        {/* Left side button to open menu */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`pointer-events-auto cursor-pointer p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <span className="material-symbols-outlined text-white/30 hover:text-white/50 text-4xl">
            chevron_right
          </span>
        </button>

        {/* Right side for channel navigation */}
        <div className="flex flex-col gap-8 pointer-events-auto">
          <button onClick={() => changeChannel(1)} className="w-16 h-16 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white active:bg-primary/40">
            <span className="material-symbols-outlined text-3xl">keyboard_arrow_up</span>
          </button>
          <button onClick={() => changeChannel(-1)} className="w-16 h-16 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white active:bg-primary/40">
            <span className="material-symbols-outlined text-3xl">keyboard_arrow_down</span>
          </button>
        </div>
      </div>

      {/* Volume Indicator Overlay (Top Center) */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex gap-1 h-4">
          <div className="w-2 h-full bg-retro-green" />
          <div className="w-2 h-full bg-retro-green" />
          <div className="w-2 h-full bg-retro-green" />
          <div className="w-2 h-full bg-retro-green" />
          <div className="w-2 h-full bg-retro-green" />
          <div className="w-2 h-full bg-white/20" />
          <div className="w-2 h-full bg-white/20" />
        </div>
        <span className="osd-text text-[10px] text-white">VOLUME</span>
      </div>
    </div>
  )
}
