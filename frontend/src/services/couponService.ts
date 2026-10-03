import type { Coupon } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api'

/**
 * ==============================================================================
 * SERVIÇO DE CUPONS (CouponService - Integração PostgreSQL)
 * ==============================================================================
 */

// 1. BUSCA TODOS OS CUPONS ATIVOS DO CLIENTE
export async function getCustomerCoupons(customerId: string | number): Promise<Coupon[]> {
  const response = await fetch(`${API_URL}/clientes/${customerId}/cupons`)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar cupons do cliente.')
  }

  return data
}

// 2. CADASTRAR NOVO CUPOM (Atende RN0036: Troco de compra em Cupom de Troca)
export async function createCustomerCoupon(
  customerId: string | number,
  coupon: {
    code?: string
    type: 'Promocional' | 'Troca'
    value: number
    description?: string
  }
): Promise<Coupon> {
  const response = await fetch(`${API_URL}/clientes/${customerId}/cupons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao gerar novo cupom.')
  }

  return data
}

// 3. MARCAR CUPOM COMO UTILIZADO
export async function useCouponByCode(code: string): Promise<void> {
  const response = await fetch(`${API_URL}/cupons/${code}/utilizar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao marcar cupom como utilizado.')
  }
}
