import { Router } from 'express'
import { getAllProducts, getProductById } from '../controllers/productController.js'

const router = Router()

// 1. Listar todos os produtos
// GET /api/produtos
router.get('/', getAllProducts)

// 2. Buscar produto por ID ou código
// GET /api/produtos/:id
router.get('/:id', getProductById)

export default router
