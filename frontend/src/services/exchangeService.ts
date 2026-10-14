import type { Exchange } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api'

export interface CreateExchangePayload {
  pedidoId?: string | number
  pedidoCodigo: string
  clienteId: string | number
  clienteNome: string
  produtoNome: string
  valorTroca: number
  motivo: string
}

// 1. LISTAR TODAS AS TROCAS (Painel Admin)
export async function getAllExchanges(): Promise<Exchange[]> {
  const response = await fetch(`${API_URL}/trocas`)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar solicitações de trocas.')
  }

  return Array.isArray(data) ? data : []
}

// 2. LISTAR TROCAS DE UM CLIENTE (Área do Cliente)
export async function getCustomerExchanges(customerId: string | number): Promise<Exchange[]> {
  const response = await fetch(`${API_URL}/clientes/${customerId}/trocas`)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar trocas do cliente.')
  }

  return Array.isArray(data) ? data : []
}

// 3. CRIAR NOVA SOLICITAÇÃO DE TROCA
export async function createExchange(payload: CreateExchangePayload): Promise<Exchange> {
  const response = await fetch(`${API_URL}/trocas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao solicitar troca.')
  }

  return data
}

// 4. ATUALIZAR STATUS DA TROCA (Aprovar, Negar, Despachar, Receber, Processar)
export async function updateExchangeStatus(exchangeId: string | number, status: string): Promise<Exchange> {
  const response = await fetch(`${API_URL}/trocas/${exchangeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao atualizar status da troca.')
  }

  return data
}
