import { Router } from 'express'
import { getSalesByCategoryReport, seedSalesReportData } from '../controllers/reportController.js'

const router = Router()

/**
 * ==============================================================================
 * ROTAS DE ANÁLISE DE VENDAS POR CATEGORIA (RF0055, RNF0043, RNF0011)
 * ==============================================================================
 */

// 1. Consultar histórico de vendas por categoria e período (Somente Admin)
router.get('/vendas-categorias', getSalesByCategoryReport)

// 2. Popular massa de dados de vendas em múltiplos meses/status para demonstração
router.post('/seed', seedSalesReportData)

export default router