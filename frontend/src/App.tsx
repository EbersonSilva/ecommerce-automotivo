import { useState, useEffect } from 'react'

interface BackendStatus {
  status: string
  message: string
  timestamp: string
  environment: string
}

function App() {
  const [count, setCount] = useState(0)
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkBackend = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3001/api/status')
      if (!response.ok) {
        throw new Error('Resposta de status não amigável do backend')
      }
      const data = await response.json()
      setBackendStatus(data)
    } catch (err: any) {
      setError(err.message || 'Não foi possível conectar ao servidor backend na porta 3001')
      setBackendStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBackend()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              AutoPeças.net
            </span>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              LES Lab
            </span>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            Setup Inicial Concluído
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 flex flex-col items-center justify-center text-center relative">
        {/* Glow decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-8 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Frontend Ativo e Pronto
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
          E-commerce de{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Peças Automotivas
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mb-12 leading-relaxed">
          Esta é a interface inicial do projeto configurada com React, TypeScript, Vite e Tailwind CSS para a disciplina de Laboratório de Engenharia de Software.
        </p>

        {/* Test Cards Grid */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl w-full mb-12">
          {/* Card 1: React State Test */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl transition hover:border-slate-700/85 text-left flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Teste de Estado React</h3>
              <p className="text-slate-400 text-xs mb-6">Testa a interatividade e a lógica básica do React na renderização local.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCount((c) => c + 1)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Incrementar
              </button>
              <span className="text-2xl font-mono font-bold text-white">
                Contador: {count}
              </span>
            </div>
          </div>

          {/* Card 2: Backend Integration Test */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl transition hover:border-slate-700/85 text-left flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Conexão com o Backend</h3>
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${backendStatus ? 'bg-emerald-500' : error ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
              </div>
              <p className="text-slate-400 text-xs mb-4">Verifica se o backend Express está respondendo em http://localhost:3001/api/status.</p>
            </div>
            
            <div className="space-y-4">
              {loading && <p className="text-xs text-indigo-400 animate-pulse">Consultando backend...</p>}
              
              {backendStatus && (
                <div className="bg-slate-950/80 border border-emerald-950/50 rounded-lg p-3 text-[11px] font-mono text-emerald-400">
                  <p><strong>Status:</strong> {backendStatus.status.toUpperCase()}</p>
                  <p><strong>Mensagem:</strong> {backendStatus.message}</p>
                  <p className="truncate"><strong>Horário:</strong> {backendStatus.timestamp}</p>
                </div>
              )}

              {error && (
                <div className="bg-slate-950/80 border border-rose-950/50 rounded-lg p-3 text-[11px] font-mono text-rose-400">
                  <p><strong>Erro:</strong> {error}</p>
                </div>
              )}

              <button
                onClick={checkBackend}
                disabled={loading}
                className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                Testar Conexão Novamente
              </button>
            </div>
          </div>
        </div>

        {/* Environment summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-left max-w-3xl">
          {[
            { label: "Framework", val: "React 18" },
            { label: "Build Tool", val: "Vite 6" },
            { label: "Styling", val: "Tailwind CSS v4" },
            { label: "Language", val: "TypeScript" },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">{item.label}</div>
              <div className="text-sm font-semibold text-slate-200">{item.val}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6">
          © {new Date().getFullYear()} - Projeto LES. Desenvolvido sob demanda para e-commerce automotivo.
        </div>
      </footer>
    </div>
  )
}

export default App
