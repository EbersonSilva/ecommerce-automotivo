const API_URL = 'http://localhost:3001/api/relatorios'

/**
 * ==============================================================================
 * SERVIÇO DE ANÁLISE DE VENDAS POR CATEGORIA (ReportService - PostgreSQL)
 * Atende: RF0055, RNF0043, RNF0011 [DRS_LES_1_2026]
 * ==============================================================================
 */

export interface MonthlySalePoint {
  monthKey: string
  monthLabel: string
  value: number
}

export interface CategorySalesSeries {
  category: string
  total: number
  data: MonthlySalePoint[]
}

export interface SalesReportResponse {
  period: {
    startDate: string
    endDate: string
  }
  availableCategories: string[]
  selectedCategories: string[]
  months: string[]
  series: CategorySalesSeries[]
  grandTotal: number
  responseTimeMs: number
}

/**
 * 1. CONSULTAR HISTÓRICO DE VENDAS POR CATEGORIA E PERÍODO (RF0055, RNF0011)
 */
export async function getSalesByCategoryReport(
  startDate: string,
  endDate: string,
  categories: string[] = [],
  userRole?: string
): Promise<SalesReportResponse> {
  // Verifica se há um cliente/usuário logado por CPF na sessão
  let loggedCpf = ''
  let derivedRole = localStorage.getItem('user-role') || 'admin'

  try {
    const savedCustomer = localStorage.getItem('logged-customer')
    if (savedCustomer) {
      const parsed = JSON.parse(savedCustomer)
      loggedCpf = String(parsed.cpf || '').replace(/\D/g, '')
      const isAdminCpf =
        loggedCpf === '99999999999' ||
        String(parsed.role || '').toUpperCase() === 'ADMIN'
      if (!userRole) {
        derivedRole = isAdminCpf ? 'admin' : 'cliente'
      }
    }
  } catch {
    // Ignora erro de parse
  }

  const role = userRole || derivedRole
  const params = new URLSearchParams({
    dataInicio: startDate,
    dataFim: endDate
  })

  if (categories.length > 0) {
    params.set('categorias', categories.join(','))
  }

  const clientStart = performance.now()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': role
  }

  // Envia o CPF logado apenas se não for uma troca manual de perfil no seletor de teste
  if (loggedCpf && !userRole) {
    headers['x-user-cpf'] = loggedCpf
  }

  const response = await fetch(`${API_URL}/vendas-categorias?${params.toString()}`, {
    method: 'GET',
    headers
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao consultar histórico de vendas por categoria.')
  }

  const clientElapsedMs = Math.max(1, Math.round(performance.now() - clientStart))

  return {
    ...data,
    responseTimeMs: data.responseTimeMs ?? clientElapsedMs
  }
}

/**
 * 2. POPULAR MASSA DE DADOS HISTÓRICA PARA DEMONSTRAÇÃO (Item 5 da Especificação)
 */
export async function seedSalesReportData(): Promise<{ message: string; pendingOrderCode: string }> {
  const response = await fetch(`${API_URL}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao gerar massa de dados de vendas.')
  }

  return data
}