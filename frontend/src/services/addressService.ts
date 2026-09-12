import type { Address } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api/clientes'

export async function getCustomerAddresses(customerId: string): Promise<Address[]> {
  const response = await fetch(`${API_URL}/${customerId}/enderecos`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar endereços do cliente.')
  }

  return data
}

export async function createCustomerAddress(customerId: string, address: Address): Promise<Address> {
  const response = await fetch(`${API_URL}/${customerId}/enderecos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address)
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao cadastrar endereço.')
  }

  return data
}