import type { CreditCard } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api/clientes'

/**
 * ==============================================================================
 * SERVIÇO DE CARTÕES DO CLIENTE (CardService)
 * ==============================================================================
 */

// 1. BUSCA TODOS OS CARTÕES DE UM CLIENTE
export async function getCustomerCards(customerId: string | number): Promise<CreditCard[]> {
  const response = await fetch(`${API_URL}/${customerId}/cartoes`)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar cartões do cliente.')
  }

  return data
}

// 2. CADASTRAR NOVO CARTÃO (RF0027, RN0024, RN0025)
export async function createCustomerCard(
  customerId: string | number,
  card: {
    numero: string
    holder: string
    brand: string
    cvv: string
    expiry: string
    preferencial?: boolean
  }
): Promise<CreditCard> {
  const response = await fetch(`${API_URL}/${customerId}/cartoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card)
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao cadastrar cartão.')
  }

  return data
}

// 3. DEFINIR CARTÃO PREFERENCIAL (RF0027)
export async function setPreferredCustomerCard(
  customerId: string | number,
  cardId: string | number
): Promise<CreditCard> {
  const response = await fetch(`${API_URL}/${customerId}/cartoes/${cardId}/preferencial`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao definir cartão preferencial.')
  }

  return data
}

// 4. EXCLUIR CARTÃO
export async function deleteCustomerCard(
  customerId: string | number,
  cardId: string | number
): Promise<void> {
  const response = await fetch(`${API_URL}/${customerId}/cartoes/${cardId}`, {
    method: 'DELETE'
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao excluir cartão.')
  }
}
