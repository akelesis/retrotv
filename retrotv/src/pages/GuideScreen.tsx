import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL, authHeaders } from '../api/api'

interface Channel {
  id: string
  abbr?: string
  name: string
  color?: string
  textColor?: string
}

interface Program {
  id: string
  title: string
  source_type?: string
}

interface ScheduleEntry {
  id: string
  channel_id: string
  program_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface ChannelWithSchedule {
  channel: Channel
  entries: ScheduleEntry[]
}

function getTimeSlots(channelsData: ChannelWithSchedule[]): string[] {
  const times = new Set<string>()
  channelsData.forEach(ch => ch.entries.forEach(e => {
    times.add(e.start_time.substring(0, 5))
    times.add(e.end_time.substring(0, 5))
  }))
  return Array.from(times).sort()
}

function formatTime(t: string) {
  return t.substring(0, 5)
}

export default function GuideScreen(): JSX.Element {
  const navigate = useNavigate()
  const [channelsData, setChannelsData] = useState<ChannelWithSchedule[]>([])
  const [programMap, setProgramMap] = useState<Map<string, Program>>(new Map())
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null)
  const [now, setNow] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date()
      setNow(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Fetch programs for lookup
  useEffect(() => {
    fetch(`${API_URL}/programs`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: Program[]) => {
        const map = new Map<string, Program>()
        data.forEach(p => map.set(p.id, p))
        setProgramMap(map)
      })
      .catch(() => {})
  }, [])

  // Fetch channels then their schedules
  useEffect(() => {
    const dayOfWeek = new Date().getDay() // 0-6, 0=Sunday
    fetch(`${API_URL}/channels`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(async (channels: Channel[]) => {
        const results = await Promise.all(
          channels.map(async (channel) => {
            try {
              const res = await fetch(`${API_URL}/channels/${channel.id}/schedule?day=${dayOfWeek}`, { headers: authHeaders() })
              const entries: ScheduleEntry[] = res.ok ? await res.json() : []
              return { channel, entries: entries.sort((a, b) => a.start_time.localeCompare(b.start_time)) }
            } catch {
              return { channel, entries: [] }
            }
          })
        )
        setChannelsData(results)
      })
      .catch(() => {})
  }, [])

  const timeSlots = getTimeSlots(channelsData)

  return (
    <div className="relative bg-[#000080] font-display text-white min-h-screen overflow-hidden flex flex-col select-none">
      {/* CRT Overlay */}
      <div className="fixed inset-0 crt-scanlines z-50 pointer-events-none opacity-40" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b-4 border-white bg-blue-900 px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-retro-yellow text-4xl">tv_gen</span>
            <h1 className="text-2xl font-bold tracking-tighter uppercase italic">Guia de TV</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/player')}
              className="bg-white/10 hover:bg-white/20 transition-colors px-3 py-1 rounded border border-white/20 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="text-xs font-bold uppercase">Voltar</span>
            </button>
            <div className="bg-black/40 px-3 py-1 rounded border border-white/20">
              <p className="text-retro-yellow font-bold text-xl tracking-widest">{now}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          <button className="flex-1 min-w-[100px] py-3 px-4 bg-retro-yellow text-black font-bold text-center uppercase border-t-4 border-x-4 border-white rounded-t-lg">
            Hoje
          </button>
          <button className="flex-1 min-w-[100px] py-3 px-4 bg-blue-800 text-white/70 font-bold text-center uppercase border-t-4 border-x-4 border-white/30 rounded-t-lg">
            Amanhã
          </button>
          <button className="flex-1 min-w-[100px] py-3 px-4 bg-blue-800 text-white/70 font-bold text-center uppercase border-t-4 border-x-4 border-white/30 rounded-t-lg">
            Semana
          </button>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Time Axis */}
        <div className="flex bg-blue-900 border-b-2 border-retro-yellow/50">
          <div className="w-20 shrink-0 bg-blue-950 border-r-2 border-white flex items-center justify-center">
            <span className="material-symbols-outlined text-white/50">schedule</span>
          </div>
          <div className="flex overflow-x-auto no-scrollbar">
            <div className="flex">
              {timeSlots.length > 0 ? (
                timeSlots.map(t => (
                  <div key={t} className="w-48 shrink-0 py-2 text-center border-r border-white/10 font-bold text-sm">
                    {t}
                  </div>
                ))
              ) : (
                <div className="w-48 shrink-0 py-2 text-center border-r border-white/10 font-bold text-sm text-white/30">--:--</div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {channelsData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <p className="text-white/40 text-sm italic">Nenhum canal disponível na programação.</p>
            </div>
          ) : (
            channelsData.map(({ channel, entries }) => (
              <div key={channel.id} className="flex border-b border-white/10 min-h-[80px]">
                <div className="w-20 shrink-0 bg-blue-950 border-r-2 border-white flex flex-col items-center justify-center p-2">
                  <div
                    style={{ backgroundColor: channel.color ?? '#475569', color: channel.textColor ?? '#FFFFFF' }}
                    className="font-black text-[10px] px-1 flex items-center justify-center w-10 h-10 rounded"
                  >
                    {channel.abbr || channel.name.substring(0, 3)}
                  </div>
                  <span className="text-[10px] font-bold mt-1 truncate max-w-[70px]">{channel.name}</span>
                </div>
                <div className="flex overflow-x-auto no-scrollbar">
                  <div className="flex items-center">
                    {entries.length === 0 ? (
                      <div className="w-48 h-[60px] mx-1 bg-white/5 border-2 border-white/10 p-2 rounded flex items-center justify-center">
                        <p className="text-[10px] text-white/30 italic">Sem programação</p>
                      </div>
                    ) : (
                      entries.map(entry => {
                        const program = programMap.get(entry.program_id)
                        return (
                          <button
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className={`w-48 h-[60px] mx-1 border-2 p-2 rounded flex flex-col justify-center ${
                              selectedEntry?.id === entry.id
                                ? 'bg-retro-yellow text-black border-white focus-glow'
                                : 'bg-blue-700/50 border-white/20'
                            }`}
                          >
                            <p className="font-bold text-xs uppercase truncate">{program?.title ?? '(Sem título)'}</p>
                            <p className="text-[10px] opacity-70">{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</p>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Detailed Footer Section */}
      <footer className="bg-black border-t-4 border-white p-4 relative z-10">
        <div className="flex gap-4 items-center">
          <div className="shrink-0">
            <div className="w-32 h-20 bg-blue-900 border-2 border-retro-yellow overflow-hidden rounded relative flex items-center justify-center">
              <span className="text-white/30 text-[10px] font-mono">{selectedEntry ? 'PREVIEW' : 'SEM SINAL'}</span>
            </div>
          </div>
          <div className="flex-1">
            {selectedEntry ? (() => {
              const program = programMap.get(selectedEntry.program_id)
              return (
                <>
                  <h3 className="text-retro-yellow font-black text-lg uppercase italic tracking-tighter">
                    {program?.title ?? '(Sem título)'}
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    {formatTime(selectedEntry.start_time)} - {formatTime(selectedEntry.end_time)}
                    {program?.source_type && <span className="ml-2 text-white/50">({program.source_type})</span>}
                  </p>
                </>
              )
            })() : (
              <p className="text-white/40 text-xs italic">Selecione um programa na grade para ver os detalhes.</p>
            )}
          </div>
        </div>
      </footer>

      {/* Bottom Nav Hints */}
      <div className="bg-blue-950 px-4 py-1 flex justify-between items-center border-t border-white/10">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-600 border border-white" />
            <span className="text-[8px] font-bold uppercase">Gravar</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white" />
            <span className="text-[8px] font-bold uppercase">Busca</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-retro-yellow border border-white" />
            <span className="text-[8px] font-bold uppercase">Info</span>
          </div>
        </div>
        <div className="text-[8px] font-mono opacity-50">VRS 1.0.94-BRAZIL</div>
      </div>
    </div>
  )
}
