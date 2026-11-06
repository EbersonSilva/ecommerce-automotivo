import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getSalesByCategoryReport,
  seedSalesReportData,
  type SalesReportResponse
} from '../../services/reportService'
import { Button } from '../../components/ui/Button'
import { useAlertModal } from '../../context/AlertModalContext'
import {
  LineChart as LineChartIcon,
  Filter,
  Clock,
  ShieldAlert,
  Database,
  CheckSquare,
  Square,
  Calendar
} from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  Freios: '#6366f1',     // Indigo
  Suspensão: '#10b981',  // Emerald
  Filtros: '#f59e0b',    // Amber
  Ignição: '#ec4899',    // Pink
  Motor: '#06b6d4',      // Cyan
  Elétrica: '#a855f7'    // Purple
}

const FALLBACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7']

function getCategoryColor(category: string, index: number): string {
  return CATEGORY_COLORS[category] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export const Reports = () => {
  const { showAlert } = useAlertModal()

  // Perfil de acesso (Critério 3.b / 4.e: restrito ao perfil administrador)
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('user-role') || 'admin'
  })

  // Filtros de período (Critério 4.a: data de início e data de fim)
  const [startDate, setStartDate] = useState('2026-05-01')
  const [endDate, setEndDate] = useState('2026-10-31')

  // Categorias disponíveis e selecionadas (Critério 3.a / 4.b)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Dados retornados do PostgreSQL
  const [reportData, setReportData] = useState<SalesReportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null)
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null)

  const fetchReport = useCallback(
    async (
      customStart = startDate,
      customEnd = endDate,
      customCategories = selectedCategories,
      roleToUse = userRole
    ) => {
      if (customStart > customEnd) {
        showAlert({
          title: 'Período Inválido',
          message: 'A data de início não pode ser maior que a data de fim.',
          type: 'warning'
        })
        return
      }

      try {
        setLoading(true)
        setAccessDeniedError(null)
        const data = await getSalesByCategoryReport(
          customStart,
          customEnd,
          customCategories,
          roleToUse
        )
        setReportData(data)
        if (data.availableCategories.length > 0) {
          setAvailableCategories(data.availableCategories)
        }
        // Na primeira carga, se nenhuma categoria estava marcada, sincroniza com as retornadas
        if (customCategories.length === 0 && data.selectedCategories.length > 0) {
          setSelectedCategories(data.selectedCategories)
        }
      } catch (err: any) {
        const msg = err.message || 'Erro ao consultar histórico de vendas.'
        if (msg.toLowerCase().includes('acesso negado') || roleToUse !== 'admin') {
          setAccessDeniedError(msg)
          setReportData(null)
        } else {
          showAlert({
            title: 'Erro na Consulta',
            message: msg,
            type: 'error'
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [startDate, endDate, selectedCategories, userRole, showAlert]
  )

  // Carrega dados iniciais ao abrir a página
  useEffect(() => {
    const currentRole = localStorage.getItem('user-role') || 'admin'
    setUserRole(currentRole)
    fetchReport('2026-05-01', '2026-10-31', [], currentRole)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        // Mantém pelo menos 1 categoria selecionada para comparação válida
        if (prev.length === 1) return prev
        return prev.filter((c) => c !== category)
      }
      return [...prev, category]
    })
  }

  const handleSelectAllCategories = () => {
    setSelectedCategories(availableCategories)
  }

  const handleApplyFilter = () => {
    fetchReport(startDate, endDate, selectedCategories, userRole)
  }

  const handleRoleChange = (newRole: string) => {
    localStorage.setItem('user-role', newRole)
    setUserRole(newRole)
    fetchReport(startDate, endDate, selectedCategories, newRole)
  }

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true)
      await seedSalesReportData()
      await fetchReport(startDate, endDate, selectedCategories, userRole)
      showAlert({
        title: 'Massa de Dados Atualizada',
        message: 'O histórico de vendas por categoria e período foi recarregado no PostgreSQL.',
        type: 'success'
      })
    } catch (err: any) {
      showAlert({
        title: 'Erro ao Carregar Massa',
        message: err.message || 'Não foi possível popular a massa de dados.',
        type: 'error'
      })
    } finally {
      setSeeding(false)
    }
  }

  // Cálculo de escala do eixo Y (Reais) do Gráfico de Linhas
  const maxSalesValue = useMemo(() => {
    if (!reportData || reportData.series.length === 0) return 2000
    let maxVal = 0
    for (const s of reportData.series) {
      for (const pt of s.data) {
        if (pt.value > maxVal) maxVal = pt.value
      }
    }
    if (maxVal <= 0) return 1000
    return Math.ceil(maxVal / 500) * 500
  }, [reportData])

  // Geometria do SVG do Gráfico de Linhas
  const svgWidth = 760
  const svgHeight = 290
  const paddingX = 65
  const paddingTop = 30
  const paddingBottom = 45
  const chartPlotWidth = svgWidth - paddingX * 2
  const chartPlotHeight = svgHeight - paddingTop - paddingBottom

  const monthsList = reportData?.months || []

  const seriesWithCoords = useMemo(() => {
    if (!reportData || monthsList.length === 0) return []
    const stepX =
      monthsList.length > 1 ? chartPlotWidth / (monthsList.length - 1) : chartPlotWidth / 2

    return reportData.series.map((serie, serieIdx) => {
      const color = getCategoryColor(serie.category, serieIdx)
      const points = serie.data.map((pt, i) => {
        const x =
          monthsList.length > 1 ? paddingX + i * stepX : paddingX + chartPlotWidth / 2
        const y =
          paddingTop + chartPlotHeight - (pt.value / maxSalesValue) * chartPlotHeight
        return {
          x,
          y,
          monthKey: pt.monthKey,
          monthLabel: pt.monthLabel,
          value: pt.value
        }
      })

      const linePath = points.reduce(
        (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
        ''
      )

      return {
        category: serie.category,
        total: serie.total,
        color,
        points,
        linePath
      }
    })
  }, [reportData, monthsList, maxSalesValue, chartPlotWidth, chartPlotHeight])

  // TELA DE BLOQUEIO PARA PERFIS NÃO-ADMINISTRADORES (Critério 3.b / 4.e / Cenário 7)
  if (accessDeniedError || userRole !== 'admin') {
    return (
      <div
        data-testid="access-denied-container"
        className="max-w-2xl mx-auto my-12 bg-slate-900/80 border border-rose-500/30 rounded-3xl p-8 text-center flex flex-col items-center gap-4 shadow-2xl"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">Acesso Restrito ao Administrador</h1>
        <p className="text-sm text-slate-300 max-w-md">
          {accessDeniedError ||
            'Acesso negado. A análise de histórico de vendas é exclusiva para o perfil Administrador.'}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            Voltar para a Loja
          </Link>
          <Button
            data-testid="btn-switch-admin"
            onClick={() => handleRoleChange('admin')}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
          >
            Autenticar como Administrador
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Análise de Vendas por Categoria
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Histórico mensal de vendas com status ENTREGUE em reais (R$) por categoria e período
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indicador de Tempo de Resposta (RNF0011 <= 1000ms) */}
          {reportData && (
            <div
              data-testid="response-time-badge"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold"
              title="Tempo de resposta da consulta ao banco de dados"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{reportData.responseTimeMs} ms</span>
            </div>
          )}

          {/* Botão para recarregar massa de dados de demonstração */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSeedDatabase}
            disabled={seeding || loading}
            data-testid="btn-seed-report"
            className="text-xs gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            {seeding ? 'Carregando Massa...' : 'Restaurar Massa de Teste'}
          </Button>

          {/* Seletor de Perfil para Demonstração de Controle de Acesso (Cenário 7) */}
          <select
            aria-label="Perfil de Acesso"
            data-testid="select-user-role"
            value={userRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="admin">Perfil: Administrador</option>
            <option value="cliente">Perfil: Cliente (Testar Bloqueio)</option>
          </select>
        </div>
      </div>

      {/* Painel de Filtros: Período (Data Início e Fim) + Seleção de Categorias */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-5 backdrop-blur-sm shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="input-data-inicio"
              className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Data de Início
            </label>
            <input
              id="input-data-inicio"
              data-testid="input-data-inicio"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 px-3.5 py-2 rounded-xl text-sm font-mono focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="input-data-fim"
              className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Data de Fim
            </label>
            <input
              id="input-data-fim"
              data-testid="input-data-fim"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 px-3.5 py-2 rounded-xl text-sm font-mono focus:outline-none"
            />
          </div>

          <div>
            <Button
              data-testid="btn-consultar-periodo"
              onClick={handleApplyFilter}
              disabled={loading}
              className="w-full gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
            >
              <Filter className="w-4 h-4" />
              {loading ? 'Consultando...' : 'Consultar Histórico'}
            </Button>
          </div>
        </div>

        {/* Seleção de Categorias para Comparação */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Categorias de Produtos para Comparação:
            </span>
            <button
              type="button"
              data-testid="btn-selecionar-todas-categorias"
              onClick={handleSelectAllCategories}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Selecionar Todas as Categorias
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5" data-testid="category-selector-group">
            {availableCategories.map((cat, idx) => {
              const isSelected = selectedCategories.includes(cat)
              const color = getCategoryColor(cat, idx)
              return (
                <button
                  key={cat}
                  type="button"
                  data-testid={`category-option-${cat}`}
                  onClick={() => handleToggleCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 text-white border-indigo-500/60 shadow-sm'
                      : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{cat}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Gráfico de Linhas por Categoria (RNF0043) */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-5">
        <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Gráfico de Linhas — Valor Total de Vendas Entregues por Mês (R$)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300" data-testid="chart-grand-total">
            Total no Período: R${' '}
            {(reportData?.grandTotal || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>

        {/* SVG do Gráfico de Linhas */}
        <div className="relative w-full h-80 bg-slate-950/70 rounded-2xl p-3 border border-slate-800/80 flex items-center justify-center">
          {monthsList.length === 0 ? (
            <span className="text-xs text-slate-500">
              Nenhum dado encontrado para o período selecionado.
            </span>
          ) : (
            <svg
              data-testid="sales-line-chart"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
            >
              {/* Linhas horizontais de grade e rótulos do eixo Y (Reais) */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingTop + chartPlotHeight * (1 - ratio)
                const value = Math.round(maxSalesValue * ratio)
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
                      x={paddingX - 14}
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      R$ {value.toLocaleString('pt-BR')}
                    </text>
                  </g>
                )
              })}

              {/* Rótulos do Eixo X (Mês/Ano - MM/AAAA) */}
              {monthsList.map((monthLabel, idx) => {
                const stepX =
                  monthsList.length > 1
                    ? chartPlotWidth / (monthsList.length - 1)
                    : chartPlotWidth / 2
                const x =
                  monthsList.length > 1
                    ? paddingX + idx * stepX
                    : paddingX + chartPlotWidth / 2
                return (
                  <g key={monthLabel}>
                    {hoveredMonthIndex === idx && (
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + chartPlotHeight}
                        stroke="#64748b"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}
                    <text
                      x={x}
                      y={paddingTop + chartPlotHeight + 24}
                      fill="#cbd5e1"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                      data-testid={`chart-month-label-${monthLabel}`}
                    >
                      {monthLabel}
                    </text>
                  </g>
                )
              })}

              {/* Séries de Linhas por Categoria */}
              {seriesWithCoords.map((serie) => (
                <g key={serie.category} data-testid={`chart-series-${serie.category}`}>
                  <path
                    data-testid={`chart-line-${serie.category}`}
                    d={serie.linePath}
                    fill="none"
                    stroke={serie.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {serie.points.map((pt, idx) => (
                    <g
                      key={`${serie.category}-${pt.monthKey}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredMonthIndex(idx)}
                      onMouseLeave={() => setHoveredMonthIndex(null)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredMonthIndex === idx ? 6 : 4.5}
                        fill={serie.color}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      {pt.value > 0 && (
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          fill={serie.color}
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          R$ {pt.value.toLocaleString('pt-BR')}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Legenda das Categorias Comparadas */}
        <div
          className="flex flex-wrap gap-6 items-center justify-center pt-1"
          data-testid="chart-legend"
        >
          {seriesWithCoords.map((serie) => (
            <div
              key={serie.category}
              className="flex items-center gap-2 text-xs text-slate-200 font-semibold"
            >
              <span
                className="w-3.5 h-3.5 rounded-full inline-block"
                style={{ backgroundColor: serie.color }}
              />
              <span>{serie.category}:</span>
              <span className="font-mono font-bold text-white">
                R${' '}
                {serie.total.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Valores Mensais por Categoria (Vendas ENTREGUE em R$) */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm shadow-xl overflow-x-auto">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          Detalhamento Mensal por Categoria — Somente Compras com Status ENTREGUE (R$)
        </h3>
        <table className="w-full text-left border-collapse text-xs" data-testid="sales-report-table">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
              <th className="py-3 px-4">Categoria</th>
              {monthsList.map((m) => (
                <th key={m} className="py-3 px-4 font-mono text-right">
                  {m}
                </th>
              ))}
              <th className="py-3 px-4 font-mono text-right text-indigo-400">
                Total no Período
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {reportData?.series.map((serie, idx) => (
              <tr
                key={serie.category}
                data-testid={`table-row-${serie.category}`}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: getCategoryColor(serie.category, idx) }}
                  />
                  {serie.category}
                </td>
                {serie.data.map((pt) => (
                  <td
                    key={pt.monthKey}
                    data-testid={`cell-${serie.category}-${pt.monthLabel}`}
                    className="py-3 px-4 font-mono text-right text-slate-300"
                  >
                    R${' '}
                    {pt.value.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                ))}
                <td
                  data-testid={`total-${serie.category}`}
                  className="py-3 px-4 font-mono font-bold text-right text-indigo-300"
                >
                  R${' '}
                  {serie.total.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Reports