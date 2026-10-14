import { Request, Response } from 'express'
import { pool, query } from '../database/db.js'

/**
 * ==============================================================================
 * CONTROLLER DE TROCAS E DEVOLUÇÕES (Logística Reversa - DRS_LES_1_2026)
 * Atende: RF0038, RN0035, RN0036
 * ==============================================================================
 */

// 1. CRIAR NOVA SOLICITAÇÃO DE TROCA
// POST /api/trocas
export const createExchange = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect()

  try {
    const {
      pedidoId,
      pedidoCodigo,
      clienteId,
      clienteNome,
      produtoNome,
      valorTroca,
      motivo
    } = req.body

    if (!pedidoCodigo || !clienteId || !produtoNome || !motivo) {
      res.status(400).json({ error: 'Pedido, cliente, produto e motivo são obrigatórios.' })
      return
    }

    const codigo = `TRO-${Math.floor(5000 + Math.random() * 4999)}`
    const valor = parseFloat(valorTroca || 0)

    await client.query('BEGIN')

    // 1. Insere o registro de troca
    const insertSql = `
      INSERT INTO trocas (
        codigo, pedido_id, pedido_codigo, cliente_id, cliente_nome,
        produto_nome, valor_troca, motivo, status, data_solicitacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'TROCA SOLICITADA', CURRENT_DATE)
      RETURNING *
    `
    const insertResult = await client.query(insertSql, [
      codigo,
      pedidoId ? parseInt(pedidoId, 10) : null,
      pedidoCodigo,
      parseInt(clienteId, 10),
      clienteNome || 'Cliente',
      produtoNome,
      valor,
      motivo
    ])

    // 2. Atualiza o status do pedido correspondente para 'TROCA SOLICITADA'
    await client.query(
      `UPDATE pedidos SET status = 'TROCA SOLICITADA' WHERE codigo = $1 OR id::text = $1`,
      [pedidoCodigo]
    )

    await client.query('COMMIT')

    const row = insertResult.rows[0]
    res.status(201).json({
      id: row.codigo,
      dbId: row.id,
      orderId: row.pedido_codigo,
      customerId: String(row.cliente_id),
      customerName: row.cliente_nome,
      product: row.produto_nome,
      value: parseFloat(row.valor_troca),
      reason: row.motivo,
      status: row.status,
      requestDate: row.data_solicitacao
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Erro ao registrar troca:', error)
    res.status(500).json({ error: 'Erro ao registrar solicitação de troca.', details: error.message })
  } finally {
    client.release()
  }
}

// 2. LISTAR TODAS AS TROCAS (Painel Admin)
// GET /api/trocas
export const getAllExchanges = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        id AS "dbId",
        codigo AS "id",
        pedido_codigo AS "orderId",
        cliente_id AS "customerId",
        cliente_nome AS "customerName",
        produto_nome AS "product",
        valor_troca AS "value",
        motivo AS "reason",
        status,
        TO_CHAR(data_solicitacao, 'YYYY-MM-DD') AS "requestDate"
      FROM trocas
      ORDER BY id DESC
    `
    const result = await query(sql)
    const list = result.rows.map((r: any) => ({
      ...r,
      value: parseFloat(r.value) || 0,
      customerId: String(r.customerId)
    }))
    res.status(200).json(list)
  } catch (error: any) {
    console.error('Erro ao listar trocas:', error)
    res.status(500).json({ error: 'Erro ao listar trocas no banco de dados.' })
  }
}

// 3. LISTAR TROCAS DE UM CLIENTE ESPECÍFICO
// GET /api/clientes/:clienteId/trocas
export const getExchangesByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params
    const sql = `
      SELECT 
        id AS "dbId",
        codigo AS "id",
        pedido_codigo AS "orderId",
        cliente_id AS "customerId",
        cliente_nome AS "customerName",
        produto_nome AS "product",
        valor_troca AS "value",
        motivo AS "reason",
        status,
        TO_CHAR(data_solicitacao, 'YYYY-MM-DD') AS "requestDate"
      FROM trocas
      WHERE cliente_id = $1
      ORDER BY id DESC
    `
    const result = await query(sql, [clienteId])
    const list = result.rows.map((r: any) => ({
      ...r,
      value: parseFloat(r.value) || 0,
      customerId: String(r.customerId)
    }))
    res.status(200).json(list)
  } catch (error: any) {
    console.error('Erro ao buscar trocas do cliente:', error)
    res.status(500).json({ error: 'Erro ao buscar trocas do cliente.' })
  }
}

// 4. ATUALIZAR STATUS DA TROCA (Admin / Cliente Despachar)
// PATCH /api/trocas/:id/status
export const updateExchangeStatus = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect()

  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = [
      'TROCA SOLICITADA',
      'TROCA ACEITA',
      'TROCA NEGADA',
      'ITEM ENVIADO',
      'ITEM RECEBIDO',
      'TROCA PROCESSADA'
    ]

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Status inválido. Permitidos: ${validStatuses.join(', ')}` })
      return
    }

    await client.query('BEGIN')

    const updateSql = `
      UPDATE trocas 
      SET status = $1 
      WHERE id::text = $2 OR codigo = $2
      RETURNING *
    `
    const result = await client.query(updateSql, [status, id])

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      res.status(404).json({ error: 'Troca não encontrada.' })
      return
    }

    const exchange = result.rows[0]
    let generatedCoupon = null

    // RN0035 / RN0036: Se a troca foi PROCESSADA, gera automaticamente um cupom de troca
    if (status === 'TROCA PROCESSADA') {
      const couponCode = `TROCA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      const couponValue = parseFloat(exchange.valor_troca) || 150.00
      const couponDesc = `Cupom de troca gerado a partir da troca ${exchange.codigo} (Pedido ${exchange.pedido_codigo})`

      const couponSql = `
        INSERT INTO cupons (codigo, tipo, valor, status, descricao, cliente_id)
        VALUES ($1, 'Troca', $2, 'Ativo', $3, $4)
        RETURNING *
      `
      const couponResult = await client.query(couponSql, [
        couponCode,
        couponValue,
        couponDesc,
        exchange.cliente_id
      ])
      generatedCoupon = couponResult.rows[0]
      console.log(`[Trocas] Cupom gerado automaticamente: ${couponCode} no valor de R$ ${couponValue}`)
    }

    await client.query('COMMIT')

    res.status(200).json({
      id: exchange.codigo,
      dbId: exchange.id,
      orderId: exchange.pedido_codigo,
      customerId: String(exchange.cliente_id),
      customerName: exchange.cliente_nome,
      product: exchange.produto_nome,
      value: parseFloat(exchange.valor_troca),
      reason: exchange.motivo,
      status: exchange.status,
      data_solicitacao: exchange.data_solicitacao,
      coupon: generatedCoupon
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Erro ao atualizar status da troca:', error)
    res.status(500).json({ error: 'Erro ao atualizar status da troca no banco.' })
  } finally {
    client.release()
  }
}
