import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Order, Customer, Product } from '../../mock/mockData'
import { getAllOrders } from '../../services/orderService'
import { getCustomers } from '../../services/customerService'
import { getProducts } from '../../services/productService'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { 
  Users, 
  ShoppingBag, 
  Boxes, 
  TrendingUp, 
  ClipboardList,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

export const Dashboard = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [ordersData, customersData, productsData] = await Promise.all([
        getAllOrders().catch(() => []),
        getCustomers().catch(() => []),
        getProducts().catch(() => [])
      ])
      setOrders(ordersData)
      setCustomers(customersData)
      setProducts(productsData)
    } catch (err) {
      console.error('Erro ao carregar métricas do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Cálculos de KPI baseados nos dados reais do PostgreSQL
  const clientCount = customers.length
  const productCount = products.length
  const totalStockItems = products.reduce((acc, p) => acc + (p.stock || 0), 0)
  const lowStockItems = products.filter((p) => (p.stock || 0) <= (p.minStock || 0)).length
  
  const totalRevenue = orders.reduce((acc, o) => {
    if (o.status !== 'CANCELADO') return acc + (o.total || 0)
    return acc
  }, 0)

  // Metadados dos Cards de Indicadores
  const cards = [
    { title: 'Total de Clientes', value: clientCount, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total de Produtos', value: productCount, icon: ShoppingBag, color: 'from-purple-500 to-pink-500' },
    { title: 'Produtos em Estoque', value: `${totalStockItems} un.`, icon: Boxes, color: 'from-emerald-500 to-teal-500' },
    { title: 'Pedidos Realizados', value: orders.length, icon: ClipboardList, color: 'from-amber-500 to-orange-500' },
    { title: 'Faturamento Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'from-indigo-500 to-purple-500' }
  ]

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Painel Executivo</h1>
          <p className="text-xs text-slate-500">Indicadores gerais e visão consolidada de vendas (PostgreSQL)</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {/* Grid de Cards de Indicadores (KPIs) */}
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
        {/* Painel: Últimos Pedidos Realizados */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Últimos Pedidos</h3>
            <Link to="/admin/pedidos" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver Todos ({orders.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className="py-3 flex justify-between items-center text-xs">
                  <div className="text-left">
                    <span className="font-bold text-slate-200 font-mono block">
                      {(order as any).code || order.id}
                    </span>
                    <span className="text-slate-500">{order.customerName} • {order.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-mono text-slate-300 font-semibold">
                      R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Nenhum pedido registrado no banco de dados até o momento.
              </div>
            )}
          </div>
        </div>

        {/* Painel: Alerta de Estoque Crítico */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Estoques Críticos</h3>
            <Link to="/admin/estoque" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver Estoque
            </Link>
          </div>

          {lowStockItems > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Existem {lowStockItems} produtos com níveis de estoque abaixo do mínimo configurado!</span>
              </div>
              <div className="divide-y divide-slate-800">
                {products
                  .filter((p) => (p.stock || 0) <= (p.minStock || 0))
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
