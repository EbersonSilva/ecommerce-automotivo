import { Router } from 'express'
import {
  sendMessageToChatbot,
  submitChatbotFeedback,
  getModelTrainingStatus,
  triggerModelTraining,
  seedChatbotData
} from '../controllers/chatbotController.js'

const router = Router()

/**
 * ==============================================================================
 * ROTAS DO CHATBOT DE RECOMENDAÇÃO COM IA GENERATIVA (RNF0044)
 * ==============================================================================
 */

// 1. Enviar pergunta ao chatbot e receber resposta + recomendações personalizadas
router.post('/mensagem', sendMessageToChatbot)

// 2. Avaliar resposta do chatbot (UTIL / NAO_UTIL) e disparar ajuste fino contínuo
router.post('/feedback', submitChatbotFeedback)

// 3. Consultar status do modelo treinado, pesos por cliente e histórico de feedbacks
router.get('/status-modelo', getModelTrainingStatus)

// 4. Disparar retreinamento / atualização do dataset JSONL manualmente
router.post('/treinar', triggerModelTraining)

// 5. Garantir massa de dados de teste (2 clientes distintos, vendas e feedbacks)
router.post('/seed', seedChatbotData)

export default router