import { Router } from 'express'
import {
  createAddress,
  getAddressesByCustomer
} from '../controllers/addressController.js'

const router = Router()

// GET /api/clientes/:clienteId/enderecos
router.get('/', getAddressesByCustomer)

// POST /api/clientes/:clienteId/enderecos
router.post('/', createAddress)

export default router
