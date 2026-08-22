import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { mockProducts, mockCustomers, mockOrders } from '../../mock/mockData'
import type { Order } from '../../mock/mockData'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { 
  Users, 
  ShoppingBag, 
  Boxes, 
  TrendingUp, 
  ClipboardList,
  AlertCircle
} from 'lucide-react'

export const Dashboard = () => {
  const [totalOrders, setTotalOrders] = useState<Order[]>([])
  
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('custom-orders')
      const customList = savedCustom ? JSON.parse(savedCustom) : []
      setTotalOrders([...customList, ...mockOrders])
    } catch {
      setTotalOrders(mockOrders)
    }
  }, [])

  // KPI Calculations
  const clientCount = mockCustomers.length
  const productCount = mockProducts.length
  
  const totalStockItems = mockProducts.reduce((acc, p) => acc + p.stock, 0)
  const lowStockItems = mockProducts.filter((p) => p.stock <= p.minStock).length
  
  const totalRevenue = totalOrders.reduce((acc, o) => {
    if (o.status !== 'CANCELADO') return acc + o.total
    return acc
  }, 0)

  // KPI Cards metadata
  const cards = [
    { title: 'Total de Clientes', value: clientCount, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total de Produtos', value: productCount, icon: ShoppingBag, color: 'from-purple-500 to-pink-500' },
    { title: 'Produtos em Estoque', value: `${totalStockItems} un.`, icon: Boxes, color: 'from-emerald-500 to-teal-500' },
    { title: 'Pedidos Concluídos', value: totalOrders.length, icon: ClipboardList, color: 'from-amber-500 to-orange-500' },
    { title: 'Total de Vendas', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'from-indigo-500 to-purple-500' }
  ]

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Painel Executivo</h1>
        <p className="text-xs text-slate-500">Indicadores e visão geral de vendas da autopeças</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div 
              key={index} 
              className="bg-slate-900/40 border border-slate-900/80 p-5 rounded-2xl flex justify-between items-start backdrop-blur-sm shadow-xl relative overflow-hidden"
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.title}</span>
                <span className="text-lg font-black text-white font-mono">{card.value}</span>
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${card.color} bg-opacity-20 text-white`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latest Activity / Orders */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-850">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Últimos Pedidos</h3>
            <Link to="/admin/pedidos" className="text-xs font-bold text-indigo-400 hover:text-indigo-350 transition-colors">
              Ver Todos
            </Link>
          </div>

          <div className="divide-y divide-slate-850">
            {totalOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-3 flex justify-between items-center text-xs">
                <div className="text-left">
                  <span className="font-bold text-slate-200 font-mono block">{order.id}</span>
                  <span className="text-slate-500">{order.customerName} • {order.date}</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="font-mono text-slate-350 font-semibold">
                    R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Status Summary */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-850">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Estoques Críticos</h3>
            <Link to="/admin/estoque" className="text-xs font-bold text-indigo-400 hover:text-indigo-350 transition-colors">
              Ver Estoque
            </Link>
          </div>

          {lowStockItems > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Existem {lowStockItems} produtos com níveis de estoque abaixo do mínimo configurado!</span>
              </div>
              <div className="divide-y divide-slate-850">
                {mockProducts
                  .filter((p) => p.stock <= p.minStock)
                  .map((product) => (
                    <div key={product.id} className="py-2.5 flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[150px]">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Qtd: <strong className="text-rose-400 font-mono">{product.stock}</strong></span>
                        <Badge variant="error">{product.stock === 0 ? 'Zerado' : 'Alerta'}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              Todos os itens operam dentro do nível de segurança de estoque.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default Dashboard
