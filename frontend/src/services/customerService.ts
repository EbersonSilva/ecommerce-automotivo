import type { Customer } from '../mock/mockData'

/**
 * URL base da API do backend.
 * Como o backend roda na porta 3001 por padrão, apontamos para lá.
 */
const API_URL = 'http://localhost:3001/api/clientes'

/**
 * ==============================================================================
 * SERVIÇO DE CLIENTES (Customer Service)
 * ==============================================================================
 * Centraliza todas as chamadas HTTP (fetch) que o Frontend faz para o Backend.
 * Desta forma, qualquer tela do sistema (Admin, Cadastro, Minha Conta)
 * usa essas mesmas funções para ler e gravar dados no PostgreSQL.
 */

// 1. Obter todos os clientes do banco de dados
export async function getCustomers(): Promise<Customer[]> {
  try {
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Falha ao buscar clientes da API:', error)
    throw error
  }
}

// 2. Obter um cliente específico pelo ID
export async function getCustomerById(id: string): Promise<Customer> {
  try {
    const response = await fetch(`${API_URL}/${id}`)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Cliente não encontrado.')
    }
    return await response.json()
  } catch (error) {
    console.error(`Falha ao buscar cliente ID ${id}:`, error)
    throw error
  }
}

// 3. Buscar cliente pelo CPF (usado na identificação do cliente)
export async function getCustomerByCpf(cpf: string): Promise<Customer> {
  try {
    const response = await fetch(`${API_URL}/cpf/${encodeURIComponent(cpf)}`)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'CPF não encontrado.')
    }
    return await response.json()
  } catch (error) {
    console.error(`Falha ao buscar cliente por CPF:`, error)
    throw error
  }
}

// 4. Cadastrar um novo cliente no PostgreSQL
export async function createCustomer(customerData: Omit<Customer, 'id' | 'code'>): Promise<Customer> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Falha ao cadastrar cliente.')
    }

    return await response.json()
  } catch (error) {
    console.error('Falha ao criar cliente:', error)
    throw error
  }
}

// 5. Atualizar os dados de um cliente existente
export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Falha ao atualizar dados do cliente.')
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Falha ao atualizar cliente ID ${id}:`, error)
    throw error
  }
}

// 6. Alternar status (Ativar / Inativar cliente)
export async function updateCustomerStatus(id: string, status: 'Ativo' | 'Inativo'): Promise<{ id: string; code: string; name: string; status: string }> {
  try {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Falha ao alterar status do cliente.')
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Falha ao alterar status do cliente ID ${id}:`, error)
    throw error
  }
}

// 7. Excluir cliente do banco de dados
// export async function deleteCustomer(id: string): Promise<void> {
//   try {
//     const response = await fetch(`${API_URL}/${id}`, {
//       method: 'DELETE',
//     })

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}))
//       throw new Error(errorData.error || 'Falha ao excluir cliente.')
//     }
//   } catch (error) {
//     console.error(`❌ Falha ao excluir cliente ID ${id}:`, error)
//     throw error
//   }
// }
