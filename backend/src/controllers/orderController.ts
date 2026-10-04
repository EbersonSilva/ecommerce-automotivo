import { Request, Response } from 'express'
import { pool, query } from '../database/db.js'

/**
 * ==============================================================================
 * CONTROLLER DE PEDIDOS (Módulo de Pedidos - DRS_LES_1_2026)
 * Atende: RF0031 a RF0038, RN0031 a RN0036
 * ==============================================================================
 */

/**
 * 1. CRIAR NOVO PEDIDO COM ITENS (Transação ACID no PostgreSQL)
 * POST /api/pedidos
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect()

  try {
    const {
      clienteId,
      clienteNome,
      codigo,
      valorSubtotal,
      valorFrete,
      valorDescontoCupons,
      valorTotal,
      formaPagamento,
      enderecoEntrega,
      enderecoCobranca,
      status,
      itens
    } = req.body

    if (!clienteId || !itens || itens.length === 0) {
      res.status(400).json({ error: 'Cliente e ao menos um item são obrigatórios para registrar o pedido.' })
      return
    }

    const orderCode = codigo || `PED-${Math.floor(1000 + Math.random() * 9000)}`
    const orderStatus = status || 'EM PROCESSAMENTO'
    const subtotal = parseFloat(valorSubtotal || 0)
    const frete = parseFloat(valorFrete || 0)
    const desconto = parseFloat(valorDescontoCupons || 0)
    const total = parseFloat(valorTotal || 0)

    // Inicia transação no PostgreSQL
    await client.query('BEGIN')

    // 1. Insere o cabeçalho do pedido na tabela 'pedidos'
    const insertOrderSql = `
      INSERT INTO pedidos (
        codigo,
        cliente_id,
        cliente_nome,
        data_pedido,
        valor_subtotal,
        valor_frete,
        valor_desconto_cupons,
        valor_total,
        forma_pagamento,
        endereco_entrega,
        endereco_cobranca,
        status
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `

    const orderResult = await client.query(insertOrderSql, [
      orderCode,
      clienteId,
      clienteNome || 'Cliente',
      subtotal,
      frete,
      desconto,
      total,
      formaPagamento || 'Cartão de Crédito',
      enderecoEntrega || '',
      enderecoCobranca || enderecoEntrega || '',
      orderStatus
    ])

    const createdOrder = orderResult.rows[0]
    const orderId = createdOrder.id

    // 2. Insere os itens na tabela 'itens_pedido'
    const insertItemSql = `
      INSERT INTO itens_pedido (
        pedido_id,
        produto_id,
        nome_produto,
        quantidade,
        preco_unitario,
        subtotal
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const createdItems = []
    for (const item of itens) {
      const itemPrice = parseFloat(item.precoUnitario || item.price || 0)
      const itemQty = parseInt(item.quantidade || item.quantity || 1, 10)
      const itemSubtotal = parseFloat(item.subtotal || (itemPrice * itemQty))

      const itemRes = await client.query(insertItemSql, [
        orderId,
        String(item.produtoId || item.productId || ''),
        item.nomeProduto || item.name || '',
        itemQty,
        itemPrice,
        itemSubtotal
      ])
      createdItems.push(itemRes.rows[0])

      // Opcional: Atualiza o estoque do produto decrementando a quantidade comprada
      if (item.produtoId || item.productId) {
        try {
          await client.query(
            `UPDATE produtos SET estoque = GREATEST(0, estoque - $1) WHERE id = $2 OR codigo = $3`,
            [itemQty, parseInt(item.produtoId || 0, 10) || null, String(item.produtoId || '')]
          )
        } catch {
          // Ignora se id não for numérico
        }
      }
    }

    // Confirma a transação
    await client.query('COMMIT')

    res.status(201).json({
      id: String(createdOrder.id),
      code: createdOrder.codigo,
      customerId: String(createdOrder.cliente_id),
      customerName: createdOrder.cliente_nome,
      date: createdOrder.data_pedido,
      subtotal: parseFloat(createdOrder.valor_subtotal),
      shipping: parseFloat(createdOrder.valor_frete),
      couponDiscount: parseFloat(createdOrder.valor_desconto_cupons),
      total: parseFloat(createdOrder.valor_total),
      paymentMethod: createdOrder.forma_pagamento,
      shippingAddress: createdOrder.endereco_entrega,
      billingAddress: createdOrder.endereco_cobranca,
      status: createdOrder.status,
      items: createdItems.map((i: any) => ({
        id: String(i.id),
        productId: String(i.produto_id),
        name: i.nome_produto,
        quantity: i.quantidade,
        price: parseFloat(i.preco_unitario),
        subtotal: parseFloat(i.subtotal)
      }))
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao criar pedido no PostgreSQL:', error)
    res.status(500).json({ error: 'Erro ao persistir pedido no banco de dados.', details: error.message })
  } finally {
    client.release()
  }
}

/**
 * 2. LISTAR PEDIDOS DE UM CLIENTE ESPECÍFICO
 * GET /api/clientes/:clienteId/pedidos
 */
export const getOrdersByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params

    const ordersSql = `
      SELECT 
        p.id,
        p.codigo AS "code",
        p.cliente_id AS "customerId",
        p.cliente_nome AS "customerName",
        TO_CHAR(p.data_pedido, 'YYYY-MM-DD') AS "date",
        p.valor_subtotal AS "subtotal",
        p.valor_frete AS "shipping",
        p.valor_desconto_cupons AS "couponDiscount",
        p.valor_total AS "total",
        p.forma_pagamento AS "paymentMethod",
        p.endereco_entrega AS "shippingAddress",
        p.endereco_cobranca AS "billingAddress",
        p.status,
        p.created_at AS "createdAt"
      FROM pedidos p
      WHERE p.cliente_id = $1
      ORDER BY p.id DESC
    `

    const ordersResult = await query(ordersSql, [clienteId])
    const orders = ordersResult.rows

    // Para cada pedido, busca seus respectivos itens
    for (const order of orders) {
      const itemsSql = `
        SELECT 
          id,
          produto_id AS "productId",
          nome_produto AS "name",
          quantidade AS "quantity",
          preco_unitario AS "price",
          subtotal
        FROM itens_pedido
        WHERE pedido_id = $1
        ORDER BY id ASC
      `
      const itemsResult = await query(itemsSql, [order.id])
      order.id = String(order.id)
      order.customerId = String(order.customerId)
      order.subtotal = parseFloat(order.subtotal) || 0
      order.shipping = parseFloat(order.shipping) || 0
      order.couponDiscount = parseFloat(order.couponDiscount) || 0
      order.total = parseFloat(order.total) || 0
      order.items = itemsResult.rows.map((i: any) => ({
        id: String(i.id),
        productId: String(i.productId),
        name: i.name,
        quantity: i.quantity,
        price: parseFloat(i.price) || 0,
        subtotal: parseFloat(i.subtotal) || 0
      }))
    }

    res.status(200).json(orders)
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedidos do cliente:', error)
    res.status(500).json({ error: 'Erro ao buscar pedidos do cliente no banco de dados.' })
  }
}

/**
 * 3. LISTAR TODOS OS PEDIDOS (Para Admin / Dashboard)
 * GET /api/pedidos
 */
export const getAllOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ordersSql = `
      SELECT 
        p.id,
        p.codigo AS "code",
        p.cliente_id AS "customerId",
        p.cliente_nome AS "customerName",
        TO_CHAR(p.data_pedido, 'YYYY-MM-DD') AS "date",
        p.valor_subtotal AS "subtotal",
        p.valor_frete AS "shipping",
        p.valor_desconto_cupons AS "couponDiscount",
        p.valor_total AS "total",
        p.forma_pagamento AS "paymentMethod",
        p.endereco_entrega AS "shippingAddress",
        p.endereco_cobranca AS "billingAddress",
        p.status,
        p.created_at AS "createdAt"
      FROM pedidos p
      ORDER BY p.id DESC
    `

    const ordersResult = await query(ordersSql)
    const orders = ordersResult.rows

    for (const order of orders) {
      const itemsSql = `
        SELECT 
          id,
          produto_id AS "productId",
          nome_produto AS "name",
          quantidade AS "quantity",
          preco_unitario AS "price",
          subtotal
        FROM itens_pedido
        WHERE pedido_id = $1
        ORDER BY id ASC
      `
      const itemsResult = await query(itemsSql, [order.id])
      order.id = String(order.id)
      order.customerId = String(order.customerId)
      order.subtotal = parseFloat(order.subtotal) || 0
      order.shipping = parseFloat(order.shipping) || 0
      order.couponDiscount = parseFloat(order.couponDiscount) || 0
      order.total = parseFloat(order.total) || 0
      order.items = itemsResult.rows.map((i: any) => ({
        id: String(i.id),
        productId: String(i.productId),
        name: i.name,
        quantity: i.quantity,
        price: parseFloat(i.price) || 0,
        subtotal: parseFloat(i.subtotal) || 0
      }))
    }

    res.status(200).json(orders)
  } catch (error: any) {
    console.error('❌ Erro ao listar pedidos:', error)
    res.status(500).json({ error: 'Erro ao listar pedidos do banco de dados.' })
  }
}

/**
 * 4. BUSCAR DETALHES DE UM PEDIDO POR ID OU CÓDIGO
 * GET /api/pedidos/:id
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const orderSql = `
      SELECT 
        p.id,
        p.codigo AS "code",
        p.cliente_id AS "customerId",
        p.cliente_nome AS "customerName",
        TO_CHAR(p.data_pedido, 'YYYY-MM-DD') AS "date",
        p.valor_subtotal AS "subtotal",
        p.valor_frete AS "shipping",
        p.valor_desconto_cupons AS "couponDiscount",
        p.valor_total AS "total",
        p.forma_pagamento AS "paymentMethod",
        p.endereco_entrega AS "shippingAddress",
        p.endereco_cobranca AS "billingAddress",
        p.status,
        p.created_at AS "createdAt"
      FROM pedidos p
      WHERE p.id::text = $1 OR p.codigo = $1
    `

    const orderResult = await query(orderSql, [id])
    if (orderResult.rows.length === 0) {
      res.status(404).json({ error: 'Pedido não encontrado.' })
      return
    }

    const order = orderResult.rows[0]
    const itemsSql = `
      SELECT 
        id,
        produto_id AS "productId",
        nome_produto AS "name",
        quantidade AS "quantity",
        preco_unitario AS "price",
        subtotal
      FROM itens_pedido
      WHERE pedido_id = $1
      ORDER BY id ASC
    `
    const itemsResult = await query(itemsSql, [order.id])
    order.id = String(order.id)
    order.customerId = String(order.customerId)
    order.subtotal = parseFloat(order.subtotal) || 0
    order.shipping = parseFloat(order.shipping) || 0
    order.couponDiscount = parseFloat(order.couponDiscount) || 0
    order.total = parseFloat(order.total) || 0
    order.items = itemsResult.rows.map((i: any) => ({
      id: String(i.id),
      productId: String(i.productId),
      name: i.name,
      quantity: i.quantity,
      price: parseFloat(i.price) || 0,
      subtotal: parseFloat(i.subtotal) || 0
    }))

    res.status(200).json(order)
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedido:', error)
    res.status(500).json({ error: 'Erro ao buscar pedido no banco de dados.' })
  }
}

/**
 * 5. ATUALIZAR STATUS DO PEDIDO
 * PATCH /api/pedidos/:id/status
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = [
      'EM PROCESSAMENTO',
      'PAGAMENTO APROVADO',
      'PAGAMENTO RECUSADO',
      'EM TRANSPORTE',
      'ENTREGUE',
      'CANCELADO',
      'TROCA SOLICITADA'
    ]

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Status inválido. Status permitidos: ${validStatuses.join(', ')}` })
      return
    }

    const updateSql = `
      UPDATE pedidos 
      SET status = $1 
      WHERE id::text = $2 OR codigo = $2
      RETURNING *
    `

    const result = await query(updateSql, [status, id])
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Pedido não encontrado.' })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('❌ Erro ao atualizar status do pedido:', error)
    res.status(500).json({ error: 'Erro ao atualizar status do pedido no banco de dados.' })
  }
}
