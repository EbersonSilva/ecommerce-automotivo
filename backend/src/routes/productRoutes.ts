import { Router } from 'express'
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  autoDeactivateOutOfStock,
  resetProductsStock,
  uploadProductImage
} from '../controllers/productController.js'

const router = Router()

// 0. Upload de imagem de produto (retorna apenas o caminho para persistência)
// POST /api/produtos/upload-imagem
router.post('/upload-imagem', uploadProductImage)

// 1. Listar produtos (RF0015 - Consulta com filtros)
// GET /api/produtos?admin=true ou GET /api/produtos
router.get('/', getAllProducts)

// 2. Inativação automática de estoque zerado (RF0013)
// POST /api/produtos/inativar-automatico
router.post('/inativar-automatico', autoDeactivateOutOfStock)

// 3. Resetar estoque para testes E2E
// POST /api/produtos/reset
router.post('/reset', resetProductsStock)

// 4. Buscar produto por ID ou código
// GET /api/produtos/:id
router.get('/:id', getProductById)

// 5. Cadastrar nova peça (RF0011, RN0011, RN0012)
// POST /api/produtos
router.post('/', createProduct)

// 6. Alterar cadastro de peça (RF0014)
// PUT /api/produtos/:id
router.put('/:id', updateProduct)

// 7. Ativar ou Inativar cadastro com justificativa (RF0012, RF0016, RN0013)
// PATCH /api/produtos/:id/status
router.patch('/:id/status', updateProductStatus)

export default router
