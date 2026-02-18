import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen(): JSX.Element {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<null | { type: 'success' | 'error'; message: string }>(null)

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user || !password) {
      setStatus({ type: 'error', message: 'Preencha usuário e senha.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || 'Credenciais inválidas.')
      }

      const data = await res.json()
      const token: string = data.access_token ?? ''
      // Decode JWT payload to extract user info
      let userId = ''
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        userId = payload.sub ?? payload.id ?? ''
      } catch { /* ignore */ }
      login(token, { id: userId, email: user })
      navigate('/player')
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao conectar.' })
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setUser('')
    setPassword('')
    setStatus(null)
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-black overflow-hidden items-center justify-center">
      <div className="absolute inset-0 z-50 crt-overlay opacity-30"></div>

      <div className="absolute inset-0 p-6 font-mono text-[#aaaaaa] text-xs sm:text-sm leading-relaxed z-0 opacity-80 overflow-hidden">
        <div className="mb-4 text-white">
          <pre className="leading-tight text-[8px] sm:text-xs tracking-[0px]" style={{ fontFamily: 'monospace' }}>
            ██████╗ ███████╗████████╗██████╗  ██████╗     ████████╗██╗   ██╗<br/>
            ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗    ╚══██╔══╝██║   ██║<br/>
            ██████╔╝█████╗     ██║   ██████╔╝██║   ██║       ██║   ██║   ██║<br/>
            ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║       ██║   ╚██╗ ██╔╝<br/>
            ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝       ██║    ╚████╔╝ <br/>
            ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝        ╚═╝     ╚═══╝  v1.0
                </pre>
        </div>
        <p>RETRO BIOS v4.50G, An Energy Star Ally</p>
        <p>Copyright (C) 1994-1998, Retro Systems Inc.</p>
        <p className="mt-4">CPU: R7000-DX2 @ 66MHz</p>
        <p>MEMORY TEST: 655360KB OK</p>
        <p>PRIMARY MASTER: 540MB IDE HDD</p>
        <p>SECONDARY MASTER: 4X CD-ROM DRIVE</p>
        <p className="mt-2 text-green-500">PCI DEVICE LISTING...</p>
        <p>BUS  DEV  FUN  DEVICE-ID  CLASS</p>
        <p>00   07   01   8086      IDE CONTROLLER</p>
        <p>00   0F   00   135B      DISPLAY ADAPTER</p>
        <p className="mt-4">LOADING KERNEL.................... DONE</p>
        <p>INITIALIZING GRAPHICAL SUBSYSTEM... OK</p>
        <p className="mt-2">Starting login_service.exe...</p>
        <p className="animate-pulse">_</p>
      </div>

      <div className="relative z-10 w-[90%] max-w-[400px] bg-retro-gray retro-border-outset shadow-2xl flex flex-col">
        <div className="retro-title-bar flex items-center justify-between p-1 px-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-sm">terminal</span>
            <span className="text-white text-xs font-bold uppercase tracking-wider">System Authentication</span>
          </div>
          <div className="flex gap-1">
            <button className="bg-retro-gray retro-border-outset size-5 flex items-center justify-center group active:border-inset">
              <span className="bg-black w-2.5 h-[2px]"></span>
            </button>
            <button className="bg-retro-gray retro-border-outset size-5 flex items-center justify-center group active:border-inset">
              <span className="material-symbols-outlined text-black text-xs font-bold leading-none">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center mb-2">
            <div className="bg-primary/10 rounded-full p-4 mb-3">
              <span className="material-symbols-outlined text-primary text-4xl">lock</span>
            </div>
            <p className="text-black text-center text-sm font-medium uppercase tracking-tight">Insira suas credenciais de acesso</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-black text-[11px] font-bold uppercase block ml-1">Usuário:</label>
              <div className="retro-border-inset bg-white p-0.5">
                <input
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-black font-mono text-sm px-2 h-9 placeholder:text-gray-400"
                  placeholder="ADMIN"
                  type="text"
                  aria-label="Usuário"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-black text-[11px] font-bold uppercase block ml-1">Senha:</label>
              <div className="retro-border-inset bg-white p-0.5 flex items-center">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-black font-mono text-sm px-2 h-9 placeholder:text-gray-400"
                  placeholder="********"
                  type={showPassword ? 'text' : 'password'}
                  aria-label="Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="px-2 text-retro-dark-gray hover:text-black"
                  aria-pressed={showPassword}
                >
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-retro-gray retro-border-outset h-10 flex items-center justify-center hover:bg-gray-200 active:shadow-inner active:border-2 active:border-retro-dark-gray transition-all disabled:opacity-60"
            >
              <span className="text-black text-xs font-bold uppercase">{loading ? 'Conectando...' : 'Entrar'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-retro-gray retro-border-outset h-10 flex items-center justify-center hover:bg-gray-200 active:shadow-inner active:border-2 active:border-retro-dark-gray transition-all"
            >
              <span className="text-black text-xs font-bold uppercase">Cancelar</span>
            </button>
          </div>
        </form>

        <div className="border-t border-retro-dark-gray p-1 px-3 flex justify-between items-center bg-[#b0b0b0]">
          <span className="text-[10px] text-gray-700 uppercase font-mono">Secure Connection: 128-bit</span>
          <span className="material-symbols-outlined text-xs text-green-700">verified_user</span>
        </div>
      </div>

      <div className="absolute bottom-6 w-full flex flex-col items-center gap-1 z-10 pointer-events-none">
        <p className="font-mono text-white text-[10px] sm:text-xs tracking-widest uppercase opacity-70">
          Press <span className="text-primary font-bold">F1</span> to Setup | <span className="text-primary font-bold">F12</span> for Boot Menu
        </p>
        <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-primary w-1/3 animate-pulse"></div>
        </div>
      </div>

      {/* status */}
      {status && (
        <div className={`absolute top-6 right-6 z-20 rounded p-2 ${status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {status.message}
        </div>
      )}

      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
    </div>
  )
}
