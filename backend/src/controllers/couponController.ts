import { Request, Response } from 'express'
import { query } from '../database/db.js'

/**
 * ==============================================================================
 * 1. LISTAR CUPONS DE UM CLIENTE (GET /api/clientes/:clienteId/cupons)
 * Busca os cupons ativos pertencentes ao cliente ou cupons gerais da loja
 * ==============================================================================
 */
export const getCouponsByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params

    const sql = `
      SELECT 
        id,
        codigo AS "code",
        tipo AS "type",
        valor AS "value",
        status,
        descricao AS "description",
        cliente_id AS "customerId",
        created_at AS "createdAt"
      FROM cupons
      WHERE (cliente_id = $1 OR cliente_id IS NULL)
        AND status = 'Ativo'
      ORDER BY tipo ASC, valor DESC
    `

    const result = await query(sql, [clienteId])
    res.status(200).json(result.rows)
  } catch (error: any) {
    console.error('❌ Erro ao buscar cupons:', error)
    res.status(500).json({ error: 'Erro ao buscar cupons no banco de dados.' })
  }
}

/**
 * ==============================================================================
 * 2. CADASTRAR NOVO CUPOM (POST /api/clientes/:clienteId/cupons ou /api/cupons)
 * Atende: RN0036 (Emissão de Cupom de Troca com a sobra/diferença)
 * ==============================================================================
 */
export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params
    const { codigo, code, tipo, type, valor, value, descricao, description, status } = req.body

    const couponCode = codigo || code || `TROCA-${Math.floor(1000 + Math.random() * 9000)}`
    const couponType = tipo || type || 'Troca'
    const couponValue = parseFloat(valor || value || 0)
    const couponDesc = descricao || description || 'Cupom gerado automaticamente'
    const couponStatus = status || 'Ativo'
    const targetCustomerId = clienteId || req.body.clienteId || null

    if (couponValue <= 0) {
      res.status(400).json({ error: 'O valor do cupom deve ser maior que zero.' })
      return
    }

    const sql = `
      INSERT INTO cupons (codigo, tipo, valor, status, descricao, cliente_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        codigo AS "code",
        tipo AS "type",
        valor AS "value",
        status,
        descricao AS "description",
        cliente_id AS "customerId",
        created_at AS "createdAt"
    `

    const result = await query(sql, [
      couponCode,
      couponType,
      couponValue,
      couponStatus,
      couponDesc,
      targetCustomerId
    ])

    console.log(`🎟️ [PostgreSQL] Novo cupom criado: ${couponCode} (R$ ${couponValue.toFixed(2)})`)
    res.status(201).json(result.rows[0])
  } catch (error: any) {
    console.error('❌ Erro ao criar cupom:', error)
    res.status(500).json({ error: 'Erro ao salvar cupom no banco de dados.' })
  }
}

/**
 * ==============================================================================
 * 3. MARCAR CUPOM COMO UTILIZADO (PATCH /api/cupons/:codigo/utilizar)
 * ==============================================================================
 */
export const useCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigo } = req.params

    const sql = `
      UPDATE cupons
      SET status = 'Utilizado'
      WHERE codigo = $1
      RETURNING id, codigo AS "code", status
    `

    const result = await query(sql, [codigo])

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Cupom não encontrado.' })
      return
    }

    res.status(200).json({ message: 'Cupom marcado como utilizado com sucesso.', coupon: result.rows[0] })
  } catch (error: any) {
    console.error('❌ Erro ao utilizar cupom:', error)
    res.status(500).json({ error: 'Erro ao atualizar status do cupom.' })
  }
}
