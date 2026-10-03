import { Router } from 'express'
import {
  getCouponsByCustomer,
  createCoupon,
  useCoupon
} from '../controllers/couponController.js'

// mergeParams: true permite acessar o parâmetro ':clienteId' vindo do server.ts
const router = Router({ mergeParams: true })

// 1. Listar todos os cupons de um cliente específico
// GET /api/clientes/:clienteId/cupons
router.get('/', getCouponsByCustomer)

// 2. Cadastrar novo cupom (Atende RN0036: Troco em cupom de troca)
// POST /api/clientes/:clienteId/cupons ou POST /api/cupons
router.post('/', createCoupon)

// 3. Marcar cupom como utilizado ao concluir pedido
// PATCH /api/cupons/:codigo/utilizar
router.patch('/:codigo/utilizar', useCoupon)

export default router
