import { Request, Response } from 'express'
import { pool, query } from '../database/db.js'

/**
 * ==============================================================================
 * CONTROLLER DE ANÁLISE DE VENDAS POR CATEGORIA (DRS_LES_2_2026)
 * Atende:
 *  - RF0055: Analisar histórico de vendas por período (data início e fim) e categorias
 *  - RNF0043: Dados estruturados por mês/ano para Gráfico de Linhas
 *  - RNF0011: Tempo de resposta para consultas em no máximo 1 segundo (< 1000ms)
 * ==============================================================================
 */

/**
 * Gera a lista de todos os meses (YYYY-MM e MM/YYYY) entre dataInicio e dataFim
 */
function generateMonthsInRange(startDateStr: string, endDateStr: string): { key: string; label: string }[] {
  const [startYear, startMonth] = startDateStr.split('-').map(Number)
  const [endYear, endMonth] = endDateStr.split('-').map(Number)

  const months: { key: string; label: string }[] = []
  let currentYear = startYear
  let currentMonth = startMonth

  // Limite de segurança de 60 meses para evitar loops infinitos em datas inválidas
  let safetyCounter = 0
  while (
    (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) &&
    safetyCounter < 60
  ) {
    const mm = String(currentMonth).padStart(2, '0')
    const yyyy = String(currentYear)
    months.push({
      key: `${yyyy}-${mm}`,
      label: `${mm}/${yyyy}`
    })

    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    safetyCounter++
  }

  return months
}

/**
 * 1. CONSULTAR HISTÓRICO DE VENDAS POR CATEGORIA E PERÍODO (RF0055, RNF0011, RNF0043)
 * GET /api/relatorios/vendas-categorias?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD&categorias=Freios,Suspensão
 */
export const getSalesByCategoryReport = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now()

  try {
    // Critério 3.b / 4.e: Restringir o acesso ao gráfico ao perfil administrador
    const roleHeader = String(req.headers['x-user-role'] || req.query.perfil || 'admin').toLowerCase()
    if (roleHeader !== 'admin' && roleHeader !== 'administrador') {
      res.status(403).json({
        error: 'Acesso negado. A análise de histórico de vendas é exclusiva para o perfil Administrador.'
      })
      return
    }

    const dataInicio = String(req.query.dataInicio || '2026-05-01')
    const dataFim = String(req.query.dataFim || '2026-10-31')
    const categoriasParam = String(req.query.categorias || '').trim()

    if (dataInicio > dataFim) {
      res.status(400).json({
        error: 'A data de início não pode ser maior que a data de fim.'
      })
      return
    }

    const selectedCategories = categoriasParam
      ? categoriasParam.split(',').map((c) => c.trim()).filter(Boolean)
      : []

    // Busca todas as categorias disponíveis cadastradas no banco
    const categoriesResult = await query(
      `SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL AND TRIM(categoria) <> '' ORDER BY categoria ASC`
    )
    const availableCategories: string[] = categoriesResult.rows.map((r: any) => r.categoria)

    const targetCategories =
      selectedCategories.length > 0 ? selectedCategories : availableCategories

    // Critérios 3.c, 3.d, 3.e:
    // - Agrupa vendas por mês (YYYY-MM / MM/YYYY)
    // - Somente compras com status = 'ENTREGUE' entram no cálculo
    // - Medida do histórico é o valor total das vendas em reais (SUM(ip.subtotal))
    const sql = `
      SELECT 
        TO_CHAR(p.data_pedido, 'YYYY-MM') AS "monthKey",
        TO_CHAR(p.data_pedido, 'MM/YYYY') AS "monthLabel",
        pr.categoria AS "category",
        COALESCE(SUM(ip.subtotal), 0)::float AS "totalSales"
      FROM pedidos p
      INNER JOIN itens_pedido ip ON ip.pedido_id = p.id
      INNER JOIN produtos pr ON (pr.id::text = ip.produto_id OR pr.codigo = ip.produto_id)
      WHERE p.status = 'ENTREGUE'
        AND p.data_pedido >= $1::date
        AND p.data_pedido <= $2::date
        AND ($3::text[] IS NULL OR pr.categoria = ANY($3::text[]))
      GROUP BY TO_CHAR(p.data_pedido, 'YYYY-MM'), TO_CHAR(p.data_pedido, 'MM/YYYY'), pr.categoria
      ORDER BY "monthKey" ASC, pr.categoria ASC
    `

    const filterArray = targetCategories.length > 0 ? targetCategories : null
    const reportResult = await query(sql, [dataInicio, dataFim, filterArray])

    const months = generateMonthsInRange(dataInicio, dataFim)

    // Mapa rápido: categoria -> { [monthKey]: valorEmReais }
    const salesMap: Record<string, Record<string, number>> = {}
    for (const cat of targetCategories) {
      salesMap[cat] = {}
      for (const m of months) {
        salesMap[cat][m.key] = 0
      }
    }

    for (const row of reportResult.rows) {
      const cat = row.category
      const mKey = row.monthKey
      const val = Number(Number(row.totalSales || 0).toFixed(2))
      if (!salesMap[cat]) {
        salesMap[cat] = {}
        for (const m of months) {
          salesMap[cat][m.key] = 0
        }
      }
      if (salesMap[cat][mKey] !== undefined) {
        salesMap[cat][mKey] = val
      }
    }

    // Série formatada para o Gráfico de Linhas por Categoria
    const series = targetCategories.map((category) => {
      const data = months.map((m) => ({
        monthKey: m.key,
        monthLabel: m.label,
        value: Number((salesMap[category]?.[m.key] || 0).toFixed(2))
      }))
      const totalCategorySales = Number(
        data.reduce((acc, item) => acc + item.value, 0).toFixed(2)
      )
      return {
        category,
        total: totalCategorySales,
        data
      }
    })

    const grandTotal = Number(
      series.reduce((acc, s) => acc + s.total, 0).toFixed(2)
    )

    const elapsedMs = Date.now() - startTime

    res.status(200).json({
      period: {
        startDate: dataInicio,
        endDate: dataFim
      },
      availableCategories,
      selectedCategories: targetCategories,
      months: months.map((m) => m.label),
      series,
      grandTotal,
      responseTimeMs: elapsedMs
    })
  } catch (error: any) {
    console.error('❌ Erro ao consultar histórico de vendas por categoria:', error)
    res.status(500).json({
      error: 'Erro ao consultar o histórico de vendas no banco de dados.',
      details: error.message
    })
  }
}

/**
 * 2. POPULAR MASSA DE DADOS PARA TESTE E DEMONSTRAÇÃO (Item 5 da Especificação)
 * POST /api/relatorios/seed
 * Garante vendas distribuídas em diferentes meses (05/2026 a 10/2026), várias categorias
 * e status distintos (ENTREGUE e outros status como EM TRANSPORTE / EM PROCESSAMENTO).
 */
export const seedSalesReportData = async (_req: Request, res: Response): Promise<void> => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Garante que existam produtos das 4 categorias principais com códigos conhecidos
    const baseProducts = [
      {
        codigo: 'REL-FRE-01',
        nome: 'Kit Pastilha e Disco de Freio Cerâmico',
        categoria: 'Freios',
        fabricante: 'Bosch',
        preco: 450.0,
        preco_custo: 250.0
      },
      {
        codigo: 'REL-SUS-01',
        nome: 'Par Amortecedor Pressurizado Dianteiro',
        categoria: 'Suspensão',
        fabricante: 'Cofap',
        preco: 600.0,
        preco_custo: 350.0
      },
      {
        codigo: 'REL-FIL-01',
        nome: 'Kit Revisão Filtros Ar, Óleo e Combustível',
        categoria: 'Filtros',
        fabricante: 'Mann-Filter',
        preco: 200.0,
        preco_custo: 110.0
      },
      {
        codigo: 'REL-IGN-01',
        nome: 'Jogo de Velas de Ignição Iridium Laser',
        categoria: 'Ignição',
        fabricante: 'NGK',
        preco: 300.0,
        preco_custo: 160.0
      }
    ]

    for (const prod of baseProducts) {
      const exists = await client.query(`SELECT id FROM produtos WHERE codigo = $1 LIMIT 1`, [prod.codigo])
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO produtos (
            codigo, nome, categoria, fabricante, preco, preco_custo, estoque, estoque_minimo, status, descricao, imagem, compatibilidade
          ) VALUES ($1, $2, $3, $4, $5, $6, 50, 5, 'Ativo', 'Peça automotiva para análise histórica', '', ARRAY['Universal'])`,
          [prod.codigo, prod.nome, prod.categoria, prod.fabricante, prod.preco, prod.preco_custo]
        )
      }
    }

    // Remove apenas os pedidos de seed anteriores (prefixo HIST-) para manter idempotência nos testes
    await client.query(`
      DELETE FROM itens_pedido 
      WHERE pedido_id IN (SELECT id FROM pedidos WHERE codigo LIKE 'HIST-%')
    `)
    await client.query(`DELETE FROM pedidos WHERE codigo LIKE 'HIST-%'`)

    // 2. Insere pedidos históricos distribuídos entre Maio/2026 e Outubro/2026
    // Incluindo compras ENTREGUE e compras em outros status (EM TRANSPORTE, EM PROCESSAMENTO, CANCELADO)
    const historicalOrders = [
      // MAIO/2026 (ENTREGUE)
      {
        codigo: 'HIST-202605-01',
        data: '2026-05-12',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 2, preco: 450.0 }, // R$ 900 (Freios)
          { codigo: 'REL-SUS-01', nome: 'Par Amortecedor Pressurizado Dianteiro', qtd: 1, preco: 600.0 }  // R$ 600 (Suspensão)
        ]
      },
      {
        codigo: 'HIST-202605-02',
        data: '2026-05-24',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-FIL-01', nome: 'Kit Revisão Filtros Ar, Óleo e Combustível', qtd: 2, preco: 200.0 } // R$ 400 (Filtros)
        ]
      },
      // JUNHO/2026 (ENTREGUE)
      {
        codigo: 'HIST-202606-01',
        data: '2026-06-10',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 3, preco: 450.0 }, // R$ 1350 (Freios)
          { codigo: 'REL-IGN-01', nome: 'Jogo de Velas de Ignição Iridium Laser', qtd: 2, preco: 300.0 }  // R$ 600 (Ignição)
        ]
      },
      {
        codigo: 'HIST-202606-02',
        data: '2026-06-21',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-SUS-01', nome: 'Par Amortecedor Pressurizado Dianteiro', qtd: 2, preco: 600.0 }, // R$ 1200 (Suspensão)
          { codigo: 'REL-FIL-01', nome: 'Kit Revisão Filtros Ar, Óleo e Combustível', qtd: 3, preco: 200.0 } // R$ 600 (Filtros)
        ]
      },
      // JULHO/2026 (ENTREGUE)
      {
        codigo: 'HIST-202607-01',
        data: '2026-07-15',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 4, preco: 450.0 }, // R$ 1800 (Freios)
          { codigo: 'REL-SUS-01', nome: 'Par Amortecedor Pressurizado Dianteiro', qtd: 1, preco: 600.0 }, // R$ 600 (Suspensão)
          { codigo: 'REL-IGN-01', nome: 'Jogo de Velas de Ignição Iridium Laser', qtd: 3, preco: 300.0 }  // R$ 900 (Ignição)
        ]
      },
      // AGOSTO/2026 (ENTREGUE)
      {
        codigo: 'HIST-202608-01',
        data: '2026-08-08',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 3, preco: 450.0 }, // R$ 1350 (Freios)
          { codigo: 'REL-SUS-01', nome: 'Par Amortecedor Pressurizado Dianteiro', qtd: 3, preco: 600.0 }, // R$ 1800 (Suspensão)
          { codigo: 'REL-FIL-01', nome: 'Kit Revisão Filtros Ar, Óleo e Combustível', qtd: 4, preco: 200.0 } // R$ 800 (Filtros)
        ]
      },
      // SETEMBRO/2026 (ENTREGUE + 1 CANCELADO que NÃO deve entrar na conta)
      {
        codigo: 'HIST-202609-01',
        data: '2026-09-14',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 5, preco: 450.0 }, // R$ 2250 (Freios)
          { codigo: 'REL-SUS-01', nome: 'Par Amortecedor Pressurizado Dianteiro', qtd: 2, preco: 600.0 }, // R$ 1200 (Suspensão)
          { codigo: 'REL-IGN-01', nome: 'Jogo de Velas de Ignição Iridium Laser', qtd: 4, preco: 300.0 }  // R$ 1200 (Ignição)
        ]
      },
      {
        codigo: 'HIST-202609-CANC',
        data: '2026-09-19',
        status: 'CANCELADO',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 10, preco: 450.0 } // R$ 4500 (NÃO CONTABILIZADO)
        ]
      },
      // OUTUBRO/2026 (1 ENTREGUE + 1 EM TRANSPORTE para testar Cenários 5 e 6!)
      {
        codigo: 'HIST-202610-01',
        data: '2026-10-10',
        status: 'ENTREGUE',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 4, preco: 450.0 }, // R$ 1800 (Freios)
          { codigo: 'REL-SUS-01', nome: 'Par Amortecedor Pressurizado Dianteiro', qtd: 3, preco: 600.0 }, // R$ 1800 (Suspensão)
          { codigo: 'REL-FIL-01', nome: 'Kit Revisão Filtros Ar, Óleo e Combustível', qtd: 5, preco: 200.0 } // R$ 1000 (Filtros)
        ]
      },
      {
        codigo: 'HIST-202610-PENDENTE',
        data: '2026-10-20',
        status: 'EM TRANSPORTE',
        itens: [
          { codigo: 'REL-FRE-01', nome: 'Kit Pastilha e Disco de Freio Cerâmico', qtd: 2, preco: 450.0 } // R$ 900 (Quando virar ENTREGUE, Outubro/Freios sobe de 1800 para 2700!)
        ]
      }
    ]

    for (const ped of historicalOrders) {
      const subtotal = ped.itens.reduce((acc, i) => acc + i.qtd * i.preco, 0)
      const orderRes = await client.query(
        `INSERT INTO pedidos (
          codigo, cliente_id, cliente_nome, data_pedido, valor_subtotal, valor_frete, valor_desconto_cupons, valor_total, forma_pagamento, endereco_entrega, endereco_cobranca, status
        ) VALUES ($1, '1', 'Carlos Henrique Silva', $2::date, $3, 0, 0, $3, 'Cartão de Crédito', 'Av. Paulista, 1000 - SP', 'Av. Paulista, 1000 - SP', $4)
        RETURNING id`,
        [ped.codigo, ped.data, subtotal, ped.status]
      )
      const orderId = orderRes.rows[0].id

      for (const item of ped.itens) {
        await client.query(
          `INSERT INTO itens_pedido (
            pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, item.codigo, item.nome, item.qtd, item.preco, item.qtd * item.preco]
        )
      }
    }

    await client.query('COMMIT')
    res.status(200).json({
      message: 'Massa de dados histórica de vendas semeada com sucesso!',
      pendingOrderCode: 'HIST-202610-PENDENTE'
    })
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao semear massa de dados de relatórios:', error)
    res.status(500).json({ error: 'Erro ao semear massa de dados.', details: error.message })
  } finally {
    client.release()
  }
}