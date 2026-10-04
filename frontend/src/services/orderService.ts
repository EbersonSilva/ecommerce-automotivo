import type { Order } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api'

/**
 * ==============================================================================
 * SERVIÇO DE PEDIDOS (OrderService - Integração PostgreSQL)
 * Atende: RF0031 a RF0038, RN0031 a RN0036
 * ==============================================================================
 */

export interface CreateOrderPayload {
  clienteId: string | number
  clienteNome: string
  codigo?: string
  valorSubtotal: number
  valorFrete: number
  valorDescontoCupons: number
  valorTotal: number
  formaPagamento: string
  enderecoEntrega: string
  enderecoCobranca?: string
  status?: string
  itens: {
    produtoId: string | number
    nomeProduto: string
    quantidade: number
    precoUnitario: number
    subtotal: number
  }[]
}

// 1. CRIAR NOVO PEDIDO (Grava em 'pedidos' e 'itens_pedido' via Transação no PostgreSQL)
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao registrar pedido no banco de dados.')
  }

  return data
}

// 2. BUSCAR PEDIDOS DO CLIENTE LOGADO
export async function getCustomerOrders(customerId: string | number): Promise<Order[]> {
  const response = await fetch(`${API_URL}/clientes/${customerId}/pedidos`)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar pedidos do cliente.')
  }

  return Array.isArray(data) ? data : []
}

// 3. BUSCAR TODOS OS PEDIDOS (Painel Administrativo)
export async function getAllOrders(): Promise<Order[]> {
  const response = await fetch(`${API_URL}/pedidos`)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao listar todos os pedidos.')
  }

  return Array.isArray(data) ? data : []
}

// 4. BUSCAR DETALHES DE UM PEDIDO POR ID OU CÓDIGO
export async function getOrderById(orderId: string | number): Promise<Order> {
  const response = await fetch(`${API_URL}/pedidos/${orderId}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar detalhes do pedido.')
  }

  return data
}

// 5. ATUALIZAR STATUS DO PEDIDO
export async function updateOrderStatus(orderId: string | number, status: string): Promise<Order> {
  const response = await fetch(`${API_URL}/pedidos/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao atualizar status do pedido.')
  }

  return data
}
