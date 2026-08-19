import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Panel */}
      <Sidebar />
      
      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4.5 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Painel Administrativo Ativo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-200 block">Eduardo Silva</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Gestor Geral</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/10">
              ES
            </div>
          </div>
        </header>
        
        <main className="p-8 flex-1 bg-slate-950/30">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default AdminLayout
