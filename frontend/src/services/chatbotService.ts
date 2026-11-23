import type { Product } from '../mock/mockData'

const API_URL = 'http://localhost:3001/api/chatbot'

/**
 * ==============================================================================
 * SERVIÇO DO CHATBOT DE RECOMENDAÇÃO COM IA GENERATIVA (RNF0044)
 * ==============================================================================
 */

export interface RecommendedProduct extends Product {
  pesoVendas?: number
  pesoPreferencias?: number
  pesoFeedback?: number
  trainedScore?: number
}

export interface ChatbotMessageResponse {
  interactionId: string
  customer: {
    id: string
    name: string
    preferredCategories: string[]
    preferredVehicles: string[]
    recentPurchases: {
      productId: string
      productName: string
      totalQuantity: number
      category: string
    }[]
  }
  modelVersion: string
  provider: string
  reply: string
  recommendedProducts: RecommendedProduct[]
}

export interface ModelTrainingStatusResponse {
  activeCustomer: {
    id: string
    name: string
    cpf: string
    preferredCategories: string[]
    preferredVehicles: string[]
    recentPurchases: {
      productId: string
      productName: string
      totalQuantity: number
      category: string
    }[]
  }
  availableCustomers: {
    id: string
    name: string
    cpf: string
  }[]
  latestTraining: {
    id: number
    versao_modelo: string
    gatilho: string
    total_vendas_processadas: number
    total_feedbacks_positivos: number
    total_feedbacks_negativos: number
    total_exemplos_jsonl: number
    resumo_ajuste: string
    created_at: string
  } | null
  customerTrainedWeights: {
    code: string
    name: string
    category: string
    pesoVendas: number
    pesoPreferencias: number
    pesoFeedback: number
    scoreFinal: number
  }[]
  recentFeedbacks: {
    id: number
    customerName: string
    question: string
    products: string[]
    feedback: 'UTIL' | 'NAO_UTIL'
    createdAt: string
  }[]
  datasetFile: string
}



function getLoggedCustomerPayload(fallbackId: string) {
  try {
    const saved = localStorage.getItem('logged-customer')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        clienteId: String(parsed.id || fallbackId),
        clienteCpf: String(parsed.cpf || ''),
        clienteNome: String(parsed.name || '')
      }
    }
  } catch {
    // Ignora erro
  }
  return { clienteId: fallbackId, clienteCpf: '', clienteNome: '' }
}

// 1. Enviar pergunta para a IA Generativa e obter recomendações personalizadas
export async function sendChatbotMessage(
  clienteId: string,
  mensagem: string
): Promise<ChatbotMessageResponse> {
  const customerInfo = getLoggedCustomerPayload(clienteId)

  const response = await fetch(`${API_URL}/mensagem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...customerInfo,
      mensagem
    })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao comunicar com o assistente de IA.')
  }
  return data
}

// 2. Avaliar resposta (UTIL ou NAO_UTIL) e disparar ajuste fino do modelo
export async function sendChatbotFeedback(
  interactionId: string,
  feedback: 'UTIL' | 'NAO_UTIL'
): Promise<{
  message: string
  trainingUpdate: ModelTrainingStatusResponse['latestTraining']
}> {
  const response = await fetch(`${API_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interactionId, feedback })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao registrar avaliação da resposta.')
  }
  return data
}

// 3. Consultar status do modelo treinado, pesos do cliente ativo e feedbacks
export async function getChatbotModelStatus(
  clienteId: string
): Promise<ModelTrainingStatusResponse> {
  const info = getLoggedCustomerPayload(clienteId)
  const params = new URLSearchParams({
    clienteId: info.clienteId,
    clienteCpf: info.clienteCpf,
    clienteNome: info.clienteNome
  })

  const response = await fetch(`${API_URL}/status-modelo?${params.toString()}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao carregar status do treinamento de IA.')
  }
  return data
}

// 4. Disparar retreinamento manual (incorporando novas vendas e feedbacks)
export async function retrainChatbotModel(gatilho?: string): Promise<any> {
  const response = await fetch(`${API_URL}/treinar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gatilho })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao retreinar o modelo de IA.')
  }
  return data
}