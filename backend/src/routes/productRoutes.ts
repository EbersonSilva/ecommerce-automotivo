import { Router } from 'express'
import { getAllProducts, getProductById, resetProductsStock } from '../controllers/productController.js'

const router = Router()

// 1. Listar todos os produtos
// GET /api/produtos
router.get('/', getAllProducts)

// 2. Resetar estoque para testes E2E
// POST /api/produtos/reset
router.post('/reset', resetProductsStock)

// 3. Buscar produto por ID ou código
// GET /api/produtos/:id
router.get('/:id', getProductById)

export default router
