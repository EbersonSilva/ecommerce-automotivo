import type { Product } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api/produtos'

/**
 * ==============================================================================
 * SERVIÇO DE PRODUTOS (ProductService - Integração PostgreSQL)
 * Atende: RF0011 a RF0016, RN0011 a RN0014
 * ==============================================================================
 */

export interface ProductFilters {
  admin?: boolean
  status?: string
  categoria?: string
}

// 1. BUSCAR PRODUTOS (RF0015 - Filtros combinados e suporte a Admin)
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const queryParams = new URLSearchParams()
  if (filters?.admin) queryParams.append('admin', 'true')
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.categoria) queryParams.append('categoria', filters.categoria)

  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL
  const response = await fetch(url)
  const data = await response.json().catch(() => ([]))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar catálogo de produtos.')
  }

  return Array.isArray(data) ? data : []
}

// 2. BUSCAR PRODUTO POR ID OU CÓDIGO
export async function getProductById(id: string | number): Promise<Product> {
  const response = await fetch(`${API_URL}/${id}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao buscar detalhes do produto.')
  }

  return data
}

// 3. CADASTRAR NOVA PEÇA (RF0011, RN0011, RN0012)
export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao cadastrar peça.')
  }

  return data
}

// 4. ALTERAR CADASTRO DA PEÇA (RF0014)
export async function updateProduct(id: string | number, payload: Partial<Product>): Promise<Product> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao atualizar dados da peça.')
  }

  return data
}

// 5. ATIVAR OU INATIVAR COM JUSTIFICATIVA (RF0012, RF0016, RN0013)
export async function updateProductStatus(
  id: string | number,
  status: 'Ativo' | 'Inativo',
  justificativa: string
): Promise<{ message: string; product: Product; justificativa: string }> {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, justificativa })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao alterar status da peça.')
  }

  return data
}

// 6. INATIVAÇÃO AUTOMÁTICA DE ESTOQUE ZERADO (RF0013)
export async function autoDeactivateOutOfStock(): Promise<{ message: string; inativados: any[] }> {
  const response = await fetch(`${API_URL}/inativar-automatico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao processar inativação automática.')
  }

  return data
}

// 7. UPLOAD DE IMAGEM DA PEÇA (Retorna apenas o caminho para persistência no PostgreSQL)
export async function uploadProductImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        const response = await fetch(`${API_URL}/upload-imagem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64
          })
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || 'Falha ao realizar upload da imagem.')
        }

        // Retorna apenas a string do caminho (ex: /products/172903829-nome.png)
        resolve(data.path)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (error) => reject(error)
  })
}
