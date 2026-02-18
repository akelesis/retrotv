import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL, authHeaders } from '../api/api'

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const
const DAY_OF_WEEK = [1, 2, 3, 4, 5, 6, 0] as const

const COLOR_OPTIONS = [
  { hex: '#DC2626', text: '#FFFFFF' },
  { hex: '#2563EB', text: '#FFFFFF' },
  { hex: '#15803D', text: '#FFFFFF' },
  { hex: '#EAB308', text: '#000000' },
  { hex: '#DB2777', text: '#FFFFFF' },
  { hex: '#9333EA', text: '#FFFFFF' },
  { hex: '#F97316', text: '#FFFFFF' },
  { hex: '#1E293B', text: '#FFFFFF' },
  { hex: '#0891B2', text: '#FFFFFF' },
  { hex: '#92400E', text: '#FFFFFF' },
]

interface Channel {
  id: string
  name: string
  abbr?: string
  color?: string
  textColor?: string
  description?: string
  logo_url?: string
  isDefault: boolean
}

interface ScheduleEntry {
  id: string
  channel_id: string
  program_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface Program {
  id: string
  title: string
  source_type: string
  source_url: string
  duration_minutes: number
  description?: string
  thumbnail_url?: string
  category_id?: string
}

interface Category {
  id: string
  name: string
}

export default function ChannelManagerScreen(): JSX.Element {
  const navigate = useNavigate()
  const [activeDay, setActiveDay] = useState(0)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState('')
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newChannel, setNewChannel] = useState({
    name: '',
    abbr: '',
    color: '#2563EB',
    textColor: '#FFFFFF',
    description: '',
    logo_url: '',
    isDefault: false,
  })

  // Program search & schedule creation
  const [programMap, setProgramMap] = useState<Map<string, Program>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [entryStartTime, setEntryStartTime] = useState('')
  const [entryEndTime, setEntryEndTime] = useState('')

  // Quick-add YouTube program
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [addingYoutube, setAddingYoutube] = useState(false)

  // Catalog program modal
  const [categories, setCategories] = useState<Category[]>([])
  const [showCatalogDialog, setShowCatalogDialog] = useState(false)
  const [addingCatalog, setAddingCatalog] = useState(false)
  const [newCatalogProgram, setNewCatalogProgram] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    source_url: '',
    duration_minutes: '',
    category_id: '',
  })

  // Fetch channels
  useEffect(() => {
    fetch(`${API_URL}/channels`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: Channel[]) => {
        setChannels(data)
        if (data.length > 0) setSelectedChannel(data[0].id)
      })
      .catch(() => {})
  }, [])

  // Fetch categories
  useEffect(() => {
    fetch(`${API_URL}/categories`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: Category[]) => setCategories(data))
      .catch(() => {})
  }, [])

  // Fetch all programs for lookup map
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

  // Fetch schedule when channel or day changes
  useEffect(() => {
    if (!selectedChannel) { setSchedule([]); return }
    fetch(`${API_URL}/channels/${selectedChannel}/schedule?day=${DAY_OF_WEEK[activeDay]}`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: ScheduleEntry[]) => setSchedule(data.sort((a, b) => a.start_time.localeCompare(b.start_time))))
      .catch(() => setSchedule([]))
  }, [selectedChannel, activeDay])

  async function handleCreateChannel() {
    if (!newChannel.name) return
    try {
      const res = await fetch(`${API_URL}/channels`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(
          Object.fromEntries(
            Object.entries(newChannel).filter(([, v]) => v !== '' && v != null)
          )
        ),
      })
      if (!res.ok) return
      const created: Channel = await res.json()
      setChannels(prev => [...prev, created])
      setSelectedChannel(created.id)
      setShowNewDialog(false)
      setNewChannel({ name: '', abbr: '', color: '#2563EB', textColor: '#FFFFFF', description: '', logo_url: '', isDefault: false })
    } catch { /* ignore */ }
  }

  async function handleDeleteChannel(id: string) {
    try {
      const res = await fetch(`${API_URL}/channels/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) return
      setChannels(prev => {
        const next = prev.filter(c => c.id !== id)
        if (selectedChannel === id) setSelectedChannel(next[0]?.id ?? '')
        return next
      })
    } catch { /* ignore */ }
  }

  async function handleDeleteScheduleEntry(entryId: string) {
    try {
      const res = await fetch(`${API_URL}/channels/${selectedChannel}/schedule/${entryId}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) return
      setSchedule(prev => prev.filter(e => e.id !== entryId))
    } catch { /* ignore */ }
  }

  async function handleSearch() {
    try {
      const res = await fetch(`${API_URL}/programs`, { headers: authHeaders() })
      if (!res.ok) return
      const data: Program[] = await res.json()
      const filtered = searchQuery
        ? data.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : data
      setSearchResults(filtered)
      // Update lookup map
      const map = new Map(programMap)
      data.forEach(p => map.set(p.id, p))
      setProgramMap(map)
    } catch { /* ignore */ }
  }

  async function handleAddYoutube() {
    if (!youtubeUrl) return
    setAddingYoutube(true)
    try {
      const res = await fetch(`${API_URL}/programs/youtube`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ url: youtubeUrl }),
      })
      if (!res.ok) return
      const created: Program = await res.json()
      setProgramMap(prev => new Map(prev).set(created.id, created))
      setSelectedProgram(created)
      setYoutubeUrl('')
    } catch { /* ignore */ }
    finally { setAddingYoutube(false) }
  }

  async function handleCreateCatalogProgram() {
    if (!newCatalogProgram.title || !newCatalogProgram.source_url || !newCatalogProgram.duration_minutes) return
    setAddingCatalog(true)
    try {
      const body: Record<string, unknown> = {
        title: newCatalogProgram.title,
        source_type: 'catalog',
        source_url: newCatalogProgram.source_url,
        duration_minutes: Number(newCatalogProgram.duration_minutes),
      }
      if (newCatalogProgram.description) body.description = newCatalogProgram.description
      if (newCatalogProgram.thumbnail_url) body.thumbnail_url = newCatalogProgram.thumbnail_url
      if (newCatalogProgram.category_id) body.category_id = newCatalogProgram.category_id

      const res = await fetch(`${API_URL}/programs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) return
      const created: Program = await res.json()
      setProgramMap(prev => new Map(prev).set(created.id, created))
      setSelectedProgram(created)
      setShowCatalogDialog(false)
      setNewCatalogProgram({ title: '', description: '', thumbnail_url: '', source_url: '', duration_minutes: '', category_id: '' })
    } catch { /* ignore */ }
    finally { setAddingCatalog(false) }
  }

  async function handleAddToSchedule() {
    if (!selectedProgram || !selectedChannel || !entryStartTime || !entryEndTime) return
    try {
      const res = await fetch(`${API_URL}/channels/${selectedChannel}/schedule`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          program_id: selectedProgram.id,
          day_of_week: DAY_OF_WEEK[activeDay],
          start_time: entryStartTime,
          end_time: entryEndTime,
        }),
      })
      if (!res.ok) return
      const created: ScheduleEntry = await res.json()
      setSchedule(prev => [...prev, created].sort((a, b) => a.start_time.localeCompare(b.start_time)))
      setSelectedProgram(null)
      setEntryStartTime('')
      setEntryEndTime('')
    } catch { /* ignore */ }
  }

  function formatTime(t: string) {
    return t.substring(0, 5) // "08:00:00" → "08:00"
  }

  return (
    <div className="font-display text-slate-900 antialiased flex items-center justify-center min-h-screen p-4 bg-[#008080]">
      <div className="w-full max-w-7xl aspect-[16/9] flex flex-col bg-[#c0c0c0] win95-border overflow-hidden">
        {/* Title Bar */}
        <div className="bg-primary p-1 flex items-center justify-between m-1 win95-border h-8">
          <div className="flex items-center gap-2 pl-1">
            <span className="material-symbols-outlined text-white text-base">settings_input_component</span>
            <h1 className="text-white text-sm font-bold tracking-tight uppercase">GERENCIADOR MULTI-CANAIS.EXE</h1>
          </div>
          <div className="flex gap-1">
            <button className="win95-button w-5 h-5 flex items-center justify-center">
              <span className="material-symbols-outlined text-xs text-black leading-none">remove</span>
            </button>
            <button className="win95-button w-5 h-5 flex items-center justify-center">
              <span className="material-symbols-outlined text-xs text-black leading-none">check_box_outline_blank</span>
            </button>
            <button onClick={() => navigate('/player')} className="win95-button w-5 h-5 flex items-center justify-center">
              <span className="material-symbols-outlined text-xs text-black leading-none">close</span>
            </button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="flex px-2 gap-4 text-xs py-0.5 border-b border-slate-400">
          <span className="hover:bg-primary hover:text-white px-1 cursor-default">Arquivo</span>
          <span className="hover:bg-primary hover:text-white px-1 cursor-default">Editar</span>
          <span className="hover:bg-primary hover:text-white px-1 cursor-default">Canais</span>
          <span className="hover:bg-primary hover:text-white px-1 cursor-default">Ajuda</span>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-0.5 px-2 mt-2">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => setActiveDay(i)}
              className={`win95-tab px-3 py-1 text-xs cursor-default ${
                activeDay === i ? 'active font-bold bg-[#c0c0c0]' : 'text-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden p-2 gap-2 bg-[#c0c0c0] border-t border-white">
          {/* Left Panel: Channel List */}
          <div className="w-48 flex flex-col gap-2">
            <div className="bg-primary px-2 py-0.5 text-[10px] text-white font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">list_alt</span> LISTA DE CANAIS
            </div>
            <div className="flex-1 win95-inset overflow-y-auto bg-slate-100 p-1 space-y-1">
              {channels.map((ch) => {
                const isSelected = selectedChannel === ch.id
                return (
                  <div
                    key={ch.id}
                    className={`w-full flex items-center gap-2 p-1 text-left border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-white'
                        : 'hover:bg-blue-100 border-transparent'
                    }`}
                    onClick={() => setSelectedChannel(ch.id)}
                  >
                    <div
                      style={{ backgroundColor: ch.color ?? '#475569', color: ch.textColor ?? '#FFFFFF' }}
                      className="w-6 h-6 flex items-center justify-center text-[10px] font-black win95-border"
                    >
                      {ch.abbr || ch.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold truncate flex-1">{ch.name}</span>
                    {isSelected && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteChannel(ch.id) }} className="text-red-300 hover:text-white">
                        <span className="material-symbols-outlined text-xs">delete</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowNewDialog(true)} className="win95-button text-[10px] font-bold py-1 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">add_box</span> NOVO CANAL
            </button>
          </div>

          {/* Center Panel: Schedule Grid */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="bg-primary px-2 py-0.5 text-[10px] text-white font-bold flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> GRADE HORÁRIA: {DAYS[activeDay].toUpperCase()} - {channels.find(c => c.id === selectedChannel)?.name ?? 'NENHUM CANAL'}
              </div>
              <span className="text-[9px] opacity-70 italic">Sincronizado com Horário Local</span>
            </div>
            <div className="flex-1 win95-inset bg-white overflow-hidden flex flex-col">
              {/* Table Header */}
              <div className="grid grid-cols-6 text-[9px] font-bold bg-slate-200 border-b border-slate-400">
                <div className="p-1 border-r border-slate-300">HORÁRIO</div>
                <div className="p-1 border-r border-slate-300 col-span-4">PROGRAMA</div>
                <div className="p-1">STATUS</div>
              </div>
              {/* Table Rows */}
              <div className="flex-1 overflow-y-auto">
                {schedule.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-[10px] text-slate-400 italic">Nenhum programa na grade para este dia.</p>
                  </div>
                ) : (
                  schedule.map((entry, i) => {
                    const program = programMap.get(entry.program_id)
                    return (
                      <div key={entry.id} className={`grid grid-cols-6 text-[10px] border-b border-slate-100 ${i === 0 ? 'bg-blue-50' : ''}`}>
                        <div className={`p-2 border-r border-slate-200 font-mono ${i === 0 ? 'font-bold text-blue-800' : 'text-slate-500'}`}>
                          {formatTime(entry.start_time)}
                        </div>
                        <div className="p-2 border-r border-slate-200 col-span-4">
                          <span className="font-bold">{program?.title ?? '(Sem programa)'}</span>
                          {program?.source_type && <p className="text-[8px] text-slate-500 mt-1 uppercase">{program.source_type}</p>}
                        </div>
                        <div className="p-2 flex items-center justify-between">
                          <span className={`text-[8px] font-bold ${i === 0 ? 'bg-green-600 px-1 text-white' : 'text-slate-400'}`}>{i === 0 ? 'NO AR' : 'AGENDADO'}</span>
                          <button onClick={() => handleDeleteScheduleEntry(entry.id)} className="text-red-400 hover:text-red-600">
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button className="win95-button flex-1 text-[10px] font-bold py-1">IMPORTAR EPG</button>
              <button className="win95-button flex-1 text-[10px] font-bold py-1">EXPORTAR GRADE</button>
              <button className="win95-button flex-1 text-[10px] font-bold py-1 text-red-700">RESETAR DIA</button>
            </div>
          </div>

          {/* Right Panel: Content Editor */}
          <div className="w-80 flex flex-col gap-2">
            <div className="bg-primary px-2 py-0.5 text-[10px] text-white font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">edit_square</span> EDITOR DE CONTEÚDO
            </div>
            <div className="flex-1 flex flex-col gap-3 win95-border bg-[#c0c0c0] p-3 overflow-y-auto">
              {/* Quick-add YouTube Program */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-red-600">smart_display</span> ADICIONAR VIA YOUTUBE
                </label>
                <div className="flex gap-1">
                  <input
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddYoutube()}
                    className="win95-inset flex-1 text-[10px] p-1.5 focus:outline-none text-black"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <button
                    onClick={handleAddYoutube}
                    disabled={!youtubeUrl || addingYoutube}
                    className="win95-button text-[10px] font-bold py-1.5 px-3 bg-green-100 disabled:opacity-50"
                  >
                    {addingYoutube ? '...' : 'ADD'}
                  </button>
                </div>
              </div>

              {/* Add from Catalog (Wasabi/S3) */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-blue-600">cloud_upload</span> ADICIONAR DO CATÁLOGO
                </label>
                <button
                  onClick={() => setShowCatalogDialog(true)}
                  className="win95-button w-full text-[10px] font-bold py-1.5 flex items-center justify-center gap-1 bg-blue-50"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span> NOVO PROGRAMA (S3/WASABI)
                </button>
              </div>

              {/* Search existing programs */}
              <div className="border-t border-slate-400 pt-3">
                <label className="block text-[9px] font-bold uppercase mb-1">Pesquisar no Catálogo:</label>
                <div className="flex gap-1">
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="win95-inset flex-1 text-[10px] p-1.5 focus:outline-none border-none text-black"
                    placeholder="Título do programa..."
                    type="text"
                  />
                  <button onClick={handleSearch} className="win95-button px-2">
                    <span className="material-symbols-outlined text-sm">search</span>
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="block text-[9px] font-bold uppercase">Resultados da Busca:</label>
                <div className="flex-1 win95-inset bg-white overflow-y-auto p-1">
                  {searchResults.length === 0 ? (
                    <p className="p-2 text-[9px] text-slate-400 italic">Nenhum resultado.</p>
                  ) : (
                    searchResults.map(prog => (
                      <div
                        key={prog.id}
                        onClick={() => setSelectedProgram(prog)}
                        className={`p-1.5 cursor-pointer border text-[10px] ${
                          selectedProgram?.id === prog.id
                            ? 'bg-primary text-white border-white'
                            : 'hover:bg-blue-50 border-transparent'
                        }`}
                      >
                        <span className="font-bold">{prog.title}</span>
                        <span className="ml-2 text-[8px] opacity-60 uppercase">{prog.source_type} · {prog.duration_minutes}min</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Schedule insertion: selected program + times */}
              <div className="border-t border-slate-400 pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-500">movie</span>
                  <span className="text-[9px] font-bold uppercase flex-1 truncate">
                    {selectedProgram ? selectedProgram.title : 'Nenhum programa selecionado'}
                  </span>
                  {selectedProgram && (
                    <button onClick={() => setSelectedProgram(null)} className="text-red-500 hover:text-red-700">
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold uppercase mb-0.5">Início:</label>
                    <input
                      type="time"
                      value={entryStartTime}
                      onChange={e => setEntryStartTime(e.target.value)}
                      className="win95-inset w-full text-[10px] p-1 focus:outline-none text-black"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold uppercase mb-0.5">Fim:</label>
                    <input
                      type="time"
                      value={entryEndTime}
                      onChange={e => setEntryEndTime(e.target.value)}
                      className="win95-inset w-full text-[10px] p-1 focus:outline-none text-black"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddToSchedule}
                  disabled={!selectedProgram || !entryStartTime || !entryEndTime || !selectedChannel}
                  className="win95-button w-full py-2 text-xs font-bold flex items-center justify-center gap-2 bg-blue-100 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">add_to_queue</span> INSERIR NA GRADE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex gap-1 p-1 m-1 bg-[#c0c0c0] border-t border-slate-400">
          <div className="flex-1 win95-inset px-2 py-0.5 text-[9px] font-bold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            SISTEMA OPERACIONAL RETRÔ - TODOS OS CANAIS ONLINE
          </div>
          <div className="w-40 win95-inset px-2 py-0.5 text-[9px] font-bold text-slate-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">settings_ethernet</span> IP: 192.168.0.101
          </div>
          <div className="w-40 win95-inset px-2 py-0.5 text-[9px] font-bold text-slate-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">memory</span> RAM: 64MB / 128MB
          </div>
          <div className="w-24 win95-inset px-2 py-0.5 text-[9px] font-bold text-slate-600 text-center flex items-center justify-center">
            14:45:22
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[440px] bg-[#c0c0c0] win95-border flex flex-col">
            <div className="bg-primary p-1 flex items-center justify-between px-2">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-white text-sm">add_box</span>
                <span className="text-white text-xs font-bold">CADASTRAR NOVO CANAL</span>
              </div>
              <button onClick={() => setShowNewDialog(false)} className="win95-button w-5 h-5 flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-black leading-none">close</span>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Name + Abbr */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase mb-0.5">Nome do Canal: *</label>
                  <input value={newChannel.name} onChange={e => setNewChannel(prev => ({ ...prev, name: e.target.value }))} className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black" placeholder="SBT BRASIL" />
                </div>
                <div className="w-20">
                  <label className="block text-[10px] font-bold uppercase mb-0.5">Sigla:</label>
                  <input value={newChannel.abbr} onChange={e => setNewChannel(prev => ({ ...prev, abbr: e.target.value }))} className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black" placeholder="SBT" maxLength={20} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Descrição:</label>
                <textarea value={newChannel.description} onChange={e => setNewChannel(prev => ({ ...prev, description: e.target.value }))} className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black resize-none h-14" placeholder="Descrição do canal..." />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">URL do Logo:</label>
                <input value={newChannel.logo_url} onChange={e => setNewChannel(prev => ({ ...prev, logo_url: e.target.value }))} className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black" placeholder="https://exemplo.com/logo.png" />
              </div>

              {/* Color + TextColor */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Cor do Canal:</label>
                <div className="flex gap-1 flex-wrap">
                  {COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.hex}
                      type="button"
                      onClick={() => setNewChannel(prev => ({ ...prev, color: opt.hex, textColor: opt.text }))}
                      style={{ backgroundColor: opt.hex }}
                      className={`w-7 h-7 win95-border ${newChannel.color === opt.hex ? 'ring-2 ring-black ring-offset-1' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* isDefault */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newChannel.isDefault} onChange={e => setNewChannel(prev => ({ ...prev, isDefault: e.target.checked }))} className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Canal padrão</span>
              </label>

              {/* Preview */}
              <div className="win95-inset bg-white p-2 flex items-center gap-3">
                {newChannel.logo_url ? (
                  <img src={newChannel.logo_url} alt="" className="w-7 h-7 object-contain win95-border" />
                ) : (
                  <div
                    style={{ backgroundColor: newChannel.color, color: newChannel.textColor }}
                    className="w-7 h-7 flex items-center justify-center text-[10px] font-black win95-border"
                  >
                    {newChannel.abbr || newChannel.name.substring(0, 2).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold block">{newChannel.name || 'NOME DO CANAL'}</span>
                  {newChannel.description && <span className="text-[8px] text-slate-500 block truncate max-w-[280px]">{newChannel.description}</span>}
                </div>
                {newChannel.isDefault && <span className="ml-auto text-[8px] bg-green-600 text-white px-1 font-bold">PADRÃO</span>}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleCreateChannel} className="win95-button flex-1 text-[10px] font-bold py-1.5">CADASTRAR</button>
                <button onClick={() => setShowNewDialog(false)} className="win95-button flex-1 text-[10px] font-bold py-1.5">CANCELAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Catalog Program Modal */}
      {showCatalogDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[480px] bg-[#c0c0c0] win95-border flex flex-col">
            <div className="bg-primary p-1 flex items-center justify-between px-2">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-white text-sm">cloud_upload</span>
                <span className="text-white text-xs font-bold">CADASTRAR PROGRAMA DO CATÁLOGO</span>
              </div>
              <button onClick={() => setShowCatalogDialog(false)} className="win95-button w-5 h-5 flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-black leading-none">close</span>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Título do Programa: *</label>
                <input
                  value={newCatalogProgram.title}
                  onChange={e => setNewCatalogProgram(prev => ({ ...prev, title: e.target.value }))}
                  className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black"
                  placeholder="Nome que aparecerá na grade"
                />
              </div>

              {/* S3 Key */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Chave do Arquivo no S3/Wasabi: *</label>
                <input
                  value={newCatalogProgram.source_url}
                  onChange={e => setNewCatalogProgram(prev => ({ ...prev, source_url: e.target.value }))}
                  className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black font-mono"
                  placeholder="videos/meu-programa.mp4"
                />
                <p className="text-[8px] text-slate-500 mt-0.5">Caminho do arquivo dentro do bucket (ex: videos/episodio-01.mp4)</p>
              </div>

              {/* Duration + Category */}
              <div className="flex gap-3">
                <div className="w-32">
                  <label className="block text-[10px] font-bold uppercase mb-0.5">Duração (min): *</label>
                  <input
                    type="number"
                    min="1"
                    value={newCatalogProgram.duration_minutes}
                    onChange={e => setNewCatalogProgram(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black"
                    placeholder="90"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase mb-0.5">Categoria:</label>
                  <select
                    value={newCatalogProgram.category_id}
                    onChange={e => setNewCatalogProgram(prev => ({ ...prev, category_id: e.target.value }))}
                    className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black bg-white"
                  >
                    <option value="">-- Nenhuma --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Descrição:</label>
                <textarea
                  value={newCatalogProgram.description}
                  onChange={e => setNewCatalogProgram(prev => ({ ...prev, description: e.target.value }))}
                  className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black resize-none h-14"
                  placeholder="Sinopse ou descrição do programa..."
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">URL da Thumbnail:</label>
                <input
                  value={newCatalogProgram.thumbnail_url}
                  onChange={e => setNewCatalogProgram(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  className="win95-inset w-full text-[11px] p-1.5 focus:outline-none text-black"
                  placeholder="https://exemplo.com/thumb.jpg"
                />
              </div>

              {/* Preview */}
              <div className="win95-inset bg-white p-2 flex items-center gap-3">
                {newCatalogProgram.thumbnail_url ? (
                  <img src={newCatalogProgram.thumbnail_url} alt="" className="w-16 h-10 object-cover win95-border" />
                ) : (
                  <div className="w-16 h-10 bg-slate-200 win95-border flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400 text-sm">movie</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold block truncate">{newCatalogProgram.title || 'TÍTULO DO PROGRAMA'}</span>
                  <span className="text-[8px] text-slate-500 block">
                    CATALOG {newCatalogProgram.duration_minutes ? `· ${newCatalogProgram.duration_minutes}min` : ''}
                    {newCatalogProgram.category_id ? ` · ${categories.find(c => c.id === newCatalogProgram.category_id)?.name}` : ''}
                  </span>
                  {newCatalogProgram.source_url && (
                    <span className="text-[7px] text-slate-400 font-mono block truncate">{newCatalogProgram.source_url}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreateCatalogProgram}
                  disabled={!newCatalogProgram.title || !newCatalogProgram.source_url || !newCatalogProgram.duration_minutes || addingCatalog}
                  className="win95-button flex-1 text-[10px] font-bold py-1.5 disabled:opacity-50"
                >
                  {addingCatalog ? 'CADASTRANDO...' : 'CADASTRAR'}
                </button>
                <button onClick={() => setShowCatalogDialog(false)} className="win95-button flex-1 text-[10px] font-bold py-1.5">CANCELAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-2 left-2 text-[10px] font-mono text-white/30 pointer-events-none uppercase">
        Windows 95 TV Management System v5.0.1 (Workstation Edition)
      </div>
    </div>
  )
}
