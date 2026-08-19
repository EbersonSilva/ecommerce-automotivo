import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Boxes, 
  ClipboardList, 
  RefreshCw, 
  BarChart3, 
  ArrowLeft
} from 'lucide-react'

export const Sidebar = () => {
  const location = useLocation()
  
  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Clientes', path: '/admin/clientes', icon: Users },
    { label: 'Produtos', path: '/admin/produtos', icon: ShoppingBag },
    { label: 'Estoque', path: '/admin/estoque', icon: Boxes },
    { label: 'Pedidos', path: '/admin/pedidos', icon: ClipboardList },
    { label: 'Trocas', path: '/admin/trocas', icon: RefreshCw },
    { label: 'Relatórios', path: '/admin/relatorios', icon: BarChart3 },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col flex-1 py-6">
        {/* Brand/Logo */}
        <div className="px-6 mb-8 flex flex-col gap-1 text-left">
          <span className="text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
            AutoPeças Admin
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Painel de Controle
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 flex flex-col text-left">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-450'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer / Back Link */}
      <div className="p-4 border-t border-slate-850 flex flex-col gap-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Voltar para Loja
        </Link>
      </div>
    </aside>
  )
}
export default Sidebar
