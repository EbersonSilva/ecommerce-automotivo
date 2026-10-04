import type { Product } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api/produtos'

/**
 * ==============================================================================
 * SERVIÇO DE PRODUTOS (ProductService - Integração PostgreSQL)
 * ==============================================================================
 */

// 1. BUSCAR TODOS OS PRODUTOS ATIVOS DO BANCO DE DADOS
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(API_URL)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar catálogo de produtos.')
  }

  return data
}

// 2. BUSCAR PRODUTO ESPECÍFICO POR ID OU CÓDIGO
export async function getProductById(id: string | number): Promise<Product> {
  const response = await fetch(`${API_URL}/${id}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar detalhes do produto.')
  }

  return data
}
