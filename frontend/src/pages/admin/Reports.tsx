import { useState, useMemo } from 'react'
import { mockReportSales, mockReportCategories } from '../../mock/mockData'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { BarChart3, Filter, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react'

export const Reports = () => {
  const [period, setPeriod] = useState('6months')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Dynamically scale/mock data changes based on filter choice
  const salesData = useMemo(() => {
    let multiplier = 1.0
    if (period === '3months') multiplier = 0.65
    if (period === '30days') multiplier = 0.25

    if (selectedCategory) {
      multiplier *= 0.35 // simulate category sub-revenue
    }

    return mockReportSales.map((item) => ({
      ...item,
      sales: Math.round(item.sales * multiplier),
      orders: Math.round(item.orders * multiplier)
    }))
  }, [period, selectedCategory])

  const totalRevenue = useMemo(() => {
    return salesData.reduce((acc, item) => acc + item.sales, 0)
  }, [salesData])

  const totalOrders = useMemo(() => {
    return salesData.reduce((acc, item) => acc + item.orders, 0)
  }, [salesData])

  const averageTicket = useMemo(() => {
    if (totalOrders === 0) return 0
    return totalRevenue / totalOrders
  }, [totalRevenue, totalOrders])

  // Chart math sizing
  const maxSales = useMemo(() => {
    const maxVal = Math.max(...salesData.map((d) => d.sales), 1000)
    return maxVal
  }, [salesData])

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Relatórios de Vendas</h1>
        <p className="text-xs text-slate-500 font-medium">Análise de desempenho, faturamento e vendas por categoria</p>
      </div>

      {/* Period and Category Filters Bar */}
      <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-end backdrop-blur-sm shadow-md">
        <div className="flex-1 w-full sm:max-w-xs">
          <Select
            label="Período do Relatório"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: '6months', label: 'Últimos 6 meses' },
              { value: '3months', label: 'Últimos 3 meses' },
              { value: '30days', label: 'Últimos 30 dias' }
            ]}
          />
        </div>
        <div className="flex-1 w-full sm:max-w-xs">
          <Select
            label="Categoria de Peças"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: '', label: 'Todas as Categorias' },
              { value: 'Freios', label: 'Freios' },
              { value: 'Filtros', label: 'Filtros' },
              { value: 'Ignição', label: 'Ignição' },
              { value: 'Suspensão', label: 'Suspensão' }
            ]}
          />
        </div>
        <Button onClick={() => alert('Filtros salvos e aplicados!')} className="w-full sm:w-auto gap-2 px-6">
          <Filter className="w-4 h-4" />
          Filtrar
        </Button>
      </div>

      {/* Reports Value Summaries cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col gap-1.5 backdrop-blur-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Faturamento do Período</span>
          <span className="text-xl font-black text-white font-mono">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            Receita bruta acumulada
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col gap-1.5 backdrop-blur-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total de Pedidos</span>
          <span className="text-xl font-black text-white font-mono">
            {totalOrders} ped.
          </span>
          <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            Compras liquidadas com sucesso
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col gap-1.5 backdrop-blur-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ticket Médio</span>
          <span className="text-xl font-black text-white font-mono">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            Média gasta por transação
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Container (SVG) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
            Gráfico de Desempenho Mensal (R$)
          </h3>

          {/* SVG Bar Chart */}
          <div className="relative w-full h-64 flex items-end justify-between px-6 pt-6 border-b border-l border-slate-800">
            {salesData.map((d, index) => {
              const heightPercent = Math.min((d.sales / maxSales) * 100, 100)
              return (
                <div key={index} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 text-[10px] font-mono text-indigo-400 py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    R$ {d.sales.toLocaleString('pt-BR')} ({d.orders} ped)
                  </div>
                  
                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className="w-8 sm:w-12 bg-gradient-to-t from-indigo-650 via-indigo-500 to-purple-500 rounded-t-lg group-hover:brightness-110 transition-all duration-500 shadow-lg shadow-indigo-500/10 cursor-pointer"
                  />
                  
                  {/* Label */}
                  <span className="text-[10px] text-slate-500 font-semibold uppercase mt-3.5 block leading-none">
                    {d.month.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex gap-4 items-center justify-center text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-gradient-to-t from-indigo-600 to-purple-500"></span>
              <span>Faturamento Total do Mês</span>
            </div>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
            Distribuição de Categorias
          </h3>

          <div className="space-y-4 text-xs mt-2">
            {mockReportCategories.map((cat, index) => (
              <div key={index} className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-[11px] font-semibold">
                  <span className="text-slate-300">{cat.category}</span>
                  <span className="text-indigo-400 font-mono">{cat.value}%</span>
                </div>
                {/* Horizontal Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-900 overflow-hidden">
                  <div 
                    style={{ width: `${cat.value}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default Reports
