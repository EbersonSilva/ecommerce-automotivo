import { useState, useMemo } from 'react'
import { mockReportSales, mockReportCategories } from '../../mock/mockData'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { BarChart3, LineChart as LineChartIcon, Filter, DollarSign, TrendingUp, ShoppingBag, CheckCircle } from 'lucide-react'

export const Reports = () => {
  const [period, setPeriod] = useState('6months')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [filterSuccess, setFilterSuccess] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Dynamically scale data based on filter choice
  const salesData = useMemo(() => {
    let baseData = [...mockReportSales]
    if (period === '3months') {
      baseData = mockReportSales.slice(3) // Last 3 months: Jun, Jul, Ago
    } else if (period === '30days') {
      baseData = mockReportSales.slice(4) // Last 2 months for trend comparison
    }

    let multiplier = 1.0
    if (selectedCategory === 'Freios') multiplier = 0.45
    else if (selectedCategory === 'Suspensão') multiplier = 0.30
    else if (selectedCategory === 'Filtros') multiplier = 0.15
    else if (selectedCategory === 'Ignição') multiplier = 0.10

    return baseData.map((item) => ({
      ...item,
      sales: Math.round(item.sales * multiplier),
      orders: Math.max(1, Math.round(item.orders * multiplier))
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
    const rawMax = Math.max(...salesData.map((d) => d.sales), 1000)
    // Round up to nearest clean ceiling for Y axis
    return Math.ceil(rawMax / 5000) * 5000
  }, [salesData])

  const handleApplyFilter = () => {
    setFilterSuccess(true)
    setTimeout(() => setFilterSuccess(false), 3000)
  }

  // SVG Line Chart coordinates math
  const svgWidth = 600
  const svgHeight = 220
  const paddingX = 45
  const paddingTop = 25
  const paddingBottom = 35
  const chartPlotWidth = svgWidth - paddingX * 2
  const chartPlotHeight = svgHeight - paddingTop - paddingBottom

  const points = useMemo(() => {
    if (salesData.length === 0) return []
    const stepX = salesData.length > 1 ? chartPlotWidth / (salesData.length - 1) : chartPlotWidth / 2
    return salesData.map((d, i) => {
      const x = paddingX + i * stepX
      const y = paddingTop + chartPlotHeight - (d.sales / maxSales) * chartPlotHeight
      return { x, y, ...d }
    })
  }, [salesData, maxSales, chartPlotWidth, chartPlotHeight])

  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
  }, [points])

  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const firstX = points[0].x
    const lastX = points[points.length - 1].x
    const bottomY = paddingTop + chartPlotHeight
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }, [linePath, points, paddingTop, chartPlotHeight])

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Relatórios de Vendas</h1>
          <p className="text-xs text-slate-500 font-medium">Análise de desempenho, faturamento e evolução de vendas</p>
        </div>
        {filterSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            Filtros atualizados com sucesso!
          </div>
        )}
      </div>

      {/* Period and Category Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-end backdrop-blur-sm shadow-md">
        <div className="flex-1 w-full sm:max-w-xs">
          <Select
            label="Período do Relatório"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: '6months', label: 'Últimos 6 meses (Março - Agosto)' },
              { value: '3months', label: 'Últimos 3 meses (Junho - Agosto)' },
              { value: '30days', label: 'Últimos 30 dias (Julho - Agosto)' }
            ]}
          />
        </div>
        <div className="flex-1 w-full sm:max-w-xs">
          <Select
            label="Filtrar por Categoria"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: '', label: 'Todas as Categorias (Geral)' },
              { value: 'Freios', label: 'Freios (45% das vendas)' },
              { value: 'Suspensão', label: 'Suspensão (30% das vendas)' },
              { value: 'Filtros', label: 'Filtros (15% das vendas)' },
              { value: 'Ignição', label: 'Ignição (10% das vendas)' }
            ]}
          />
        </div>
        <Button onClick={handleApplyFilter} className="w-full sm:w-auto gap-2 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30">
          <Filter className="w-4 h-4" />
          Aplicar Filtros
        </Button>
      </div>

      {/* Reports Value Summaries cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1.5 backdrop-blur-sm shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Faturamento do Período</span>
          <span className="text-2xl font-black text-white font-mono">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-indigo-400" />
            Receita bruta acumulada {selectedCategory ? `(${selectedCategory})` : ''}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1.5 backdrop-blur-sm shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total de Pedidos</span>
          <span className="text-2xl font-black text-white font-mono">
            {totalOrders} pedidos
          </span>
          <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Compras liquidadas com sucesso
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1.5 backdrop-blur-sm shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ticket Médio</span>
          <span className="text-2xl font-black text-white font-mono">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Média de valor por pedido
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Container */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-4">
          <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 gap-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              {chartType === 'line' ? (
                <LineChartIcon className="w-4.5 h-4.5 text-indigo-400" />
              ) : (
                <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
              )}
              {chartType === 'line' ? 'Gráfico de Linhas de Vendas (R$)' : 'Gráfico de Barras de Vendas (R$)'}
            </h3>

            {/* Toggle between Line and Bar Chart */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  chartType === 'line'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                Linhas
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Barras
              </button>
            </div>
          </div>

          {/* Render Active Chart View */}
          {chartType === 'line' ? (
            /* ================= SVG LINE CHART ================= */
            <div className="relative w-full h-64 bg-slate-950/60 rounded-2xl p-2 border border-slate-800/80 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Grid Lines & Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = paddingTop + chartPlotHeight * (1 - ratio)
                  const value = Math.round(maxSales * ratio)
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX - 10}
                        y1={y}
                        x2={svgWidth - paddingX + 10}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray={ratio === 0 ? undefined : '4 4'}
                        strokeWidth={ratio === 0 ? '1.5' : '1'}
                      />
                      <text
                        x={paddingX - 15}
                        y={y + 4}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        R${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                      </text>
                    </g>
                  )
                })}

                {/* Area Fill Under Curve */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                  />
                )}

                {/* Main Line Stroke */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points (Dots), Labels & Interactivity */}
                {points.map((pt, index) => {
                  const isHovered = hoveredIndex === index
                  return (
                    <g key={index} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}>
                      {/* Vertical line indicator on hover */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={paddingTop}
                          x2={pt.x}
                          y2={paddingTop + chartPlotHeight}
                          stroke="#818cf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Dot Glow */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 8 : 5}
                        fill="#6366f1"
                        className="transition-all duration-200"
                        opacity={isHovered ? 0.4 : 0.2}
                      />
                      {/* Inner Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5.5 : 4}
                        fill={isHovered ? '#ec4899' : '#a855f7'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-200"
                      />

                      {/* X-axis Month Label */}
                      <text
                        x={pt.x}
                        y={paddingTop + chartPlotHeight + 20}
                        fill={isHovered ? '#ffffff' : '#94a3b8'}
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : '600'}
                        textAnchor="middle"
                        style={{ textTransform: 'uppercase' }}
                      >
                        {pt.month.slice(0, 3)}
                      </text>

                      {/* Static Value on top of point */}
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        fill={isHovered ? '#a5b4fc' : '#cbd5e1'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        R$ {pt.sales.toLocaleString('pt-BR')}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          ) : (
            /* ================= BAR CHART ================= */
            <div className="relative w-full h-64 bg-slate-950/60 rounded-2xl px-6 pt-8 pb-3 border border-slate-800/80 flex items-end justify-between gap-3">
              {salesData.map((d, index) => {
                const heightPx = maxSales > 0 ? Math.max(16, (d.sales / maxSales) * 160) : 16
                return (
                  <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute top-0 -translate-y-1 bg-slate-900 border border-slate-700 shadow-xl text-[11px] font-mono text-indigo-300 py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      R$ {d.sales.toLocaleString('pt-BR')} • {d.orders} ped
                    </div>

                    {/* Value label above bar */}
                    <span className="text-[10px] font-mono font-bold text-slate-300 mb-1.5 opacity-90 group-hover:text-indigo-300 transition-colors">
                      R$ {d.sales >= 1000 ? `${(d.sales / 1000).toFixed(1)}k` : d.sales}
                    </span>

                    {/* Visible Bar with explicit height in pixels */}
                    <div
                      style={{ height: `${heightPx}px` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-500 rounded-t-lg group-hover:brightness-125 transition-all duration-300 shadow-lg shadow-indigo-500/20 cursor-pointer"
                    />

                    {/* Month Label */}
                    <span className="text-[11px] text-slate-400 font-semibold uppercase mt-2.5 block leading-none">
                      {d.month.slice(0, 3)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-6 items-center justify-center text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-500 ring-2 ring-indigo-400/40"></span>
              <span>Linha de Vendas ({selectedCategory ? selectedCategory : 'Total Geral'})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded bg-purple-500"></span>
              <span>Dados consolidados em Reais (R$)</span>
            </div>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-800">
            Distribuição de Categorias
          </h3>

          <div className="space-y-4 text-xs mt-2">
            {mockReportCategories.map((cat, index) => (
              <div
                key={index}
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? '' : cat.category)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  selectedCategory === cat.category
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-[12px] font-semibold mb-1.5">
                  <span className={selectedCategory === cat.category ? 'text-indigo-300 font-bold' : 'text-slate-300'}>
                    {cat.category} {selectedCategory === cat.category && '(Filtrado)'}
                  </span>
                  <span className="text-indigo-400 font-mono font-bold">{cat.value}%</span>
                </div>
                {/* Horizontal Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                  <div 
                    style={{ width: `${cat.value}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 text-center mt-auto">
            Clique em qualquer categoria acima para filtrar o gráfico
          </p>
        </div>
      </div>
    </div>
  )
}

export default Reports
