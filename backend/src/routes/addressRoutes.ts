import { Router } from 'express'
import {
  createAddress,
  getAddressesByCustomer,
  updateAddress,
  deleteAddress
} from '../controllers/addressController.js'

const router = Router({ mergeParams: true })// Permite acessar os parâmetros da rota pai (clienteId) 

// GET /api/clientes/:clienteId/enderecos
router.get('/', getAddressesByCustomer)

// POST /api/clientes/:clienteId/enderecos
router.post('/', createAddress)

// PUT /api/clientes/:clienteId/enderecos/:id
router.put('/:id', updateAddress)
// DELETE /api/clientes/:clienteId/enderecos/:id
router.delete('/:id', deleteAddress)

export default router
