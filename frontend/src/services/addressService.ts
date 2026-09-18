import type { Address } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api/clientes'

// 1. BUSCA OS ENDEREÇOS CADASTRADOS PELO CLIENTE
export async function getCustomerAddresses(customerId: string): Promise<Address[]> {
  const response = await fetch(`${API_URL}/${customerId}/enderecos`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar endereços do cliente.')
  }

  return data
}

// 2. CADASTRAR NOVO ENDEREÇO
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

// 3. ATUALIZAR ENDEREÇO EXISTENTE
export async function updateCustomerAddress(customerId: string, addressId: string, address: Address): Promise<Address> {
  const response = await fetch(`${API_URL}/${customerId}/enderecos/${addressId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address)
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao atualizar endereço.')
  }

  return data
}

// 4. EXCLUIR ENDEREÇO DO BANCO DE DADOS
export async function deleteCustomerAddress(customerId: string, addressId: string): Promise<void> {
  const response = await fetch(`${API_URL}/${customerId}/enderecos/${addressId}`, {
    method: 'DELETE'
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao excluir endereço.')
  }
}
