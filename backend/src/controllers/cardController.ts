import { Request, Response } from 'express'
import { pool, query } from '../database/db.js'

// Bandeiras permitidas pelo sistema conforme a RN0025
const BANDEIRAS_PERMITIDAS = ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express']

/**
 * ==============================================================================
 * 1. LISTAR CARTÕES DE UM CLIENTE (GET /api/clientes/:clienteId/cartoes)
 * ==============================================================================
 */
export const getCardsByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params

    const sql = `
      SELECT 
        id,
        cliente_id AS "clienteId",
        numero,
        nome_impresso AS "holder",
        bandeira AS "brand",
        codigo_seguranca AS "cvv",
        validade AS "expiry",
        preferencial,
        created_at AS "createdAt"
      FROM cartoes
      WHERE cliente_id = $1
      ORDER BY preferencial DESC, id ASC
    `

    const result = await query(sql, [clienteId])
    res.status(200).json(result.rows)
  } catch (error: any) {
    console.error('❌ Erro ao buscar cartões:', error)
    res.status(500).json({ error: 'Erro ao buscar cartões do cliente no banco de dados.' })
  }
}

/**
 * ==============================================================================
 * 2. CADASTRAR NOVO CARTÃO (POST /api/clientes/:clienteId/cartoes)
 * Atende: RF0027, RN0024, RN0025
 * ==============================================================================
 */
export const createCard = async (req: Request, res: Response): Promise<void> => {
  const dbClient = await pool.connect()

  try {
    const { clienteId } = req.params
    const { numero, nomeImpresso, holder, bandeira, brand, codigoSeguranca, cvv, validade, expiry, preferencial } = req.body

    // Normaliza os nomes de campos caso venham em português ou inglês
    const cardHolder = nomeImpresso || holder
    const cardBrand = bandeira || brand
    const cardCvv = codigoSeguranca || cvv
    const cardExpiry = validade || expiry
    const cleanNumber = String(numero || '').replace(/\s/g, '')

    // RN0024: Validação dos campos obrigatórios
    if (!cleanNumber || !cardHolder || !cardBrand || !cardCvv || !cardExpiry) {
      res.status(400).json({ error: 'Todos os campos do cartão são de preenchimento obrigatório (RN0024).' })
      return
    }

    // RN0025: Validação da bandeira permitida
    if (!BANDEIRAS_PERMITIDAS.includes(cardBrand)) {
      res.status(400).json({ 
        error: `Bandeira inválida. Bandeiras permitidas: ${BANDEIRAS_PERMITIDAS.join(', ')} (RN0025).` 
      })
      return
    }

    await dbClient.query('BEGIN')

    // Verifica quantos cartões o cliente já possui
    const countSql = 'SELECT COUNT(*) FROM cartoes WHERE cliente_id = $1'
    const countResult = await dbClient.query(countSql, [clienteId])
    const totalCards = parseInt(countResult.rows[0].count, 10)

    // RF0027: Se for o 1º cartão, ele OBRIGATORIAMENTE se torna o preferencial
    let isPreferencial = totalCards === 0 ? true : Boolean(preferencial)

    // Se este novo cartão for o preferencial, desmarca os anteriores
    if (isPreferencial && totalCards > 0) {
      await dbClient.query(
        'UPDATE cartoes SET preferencial = FALSE, updated_at = CURRENT_TIMESTAMP WHERE cliente_id = $1',
        [clienteId]
      )
    }

    const insertSql = `
      INSERT INTO cartoes (
        cliente_id, numero, nome_impresso, bandeira, codigo_seguranca, validade, preferencial
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        cliente_id AS "clienteId",
        numero,
        nome_impresso AS "holder",
        bandeira AS "brand",
        codigo_seguranca AS "cvv",
        validade AS "expiry",
        preferencial,
        created_at AS "createdAt"
    `

    const values = [clienteId, cleanNumber, cardHolder, cardBrand, cardCvv, cardExpiry, isPreferencial]
    const insertResult = await dbClient.query(insertSql, values)

    await dbClient.query('COMMIT')

    res.status(201).json(insertResult.rows[0])
  } catch (error: any) {
    await dbClient.query('ROLLBACK')
    console.error('❌ Erro ao cadastrar cartão:', error)
    res.status(500).json({ error: 'Erro interno ao cadastrar cartão no banco de dados.' })
  } finally {
    dbClient.release()
  }
}

/**
 * ==============================================================================
 * 3. DEFINIR CARTÃO PREFERENCIAL (PATCH /api/clientes/:clienteId/cartoes/:id/preferencial)
 * Atende: RF0027
 * ==============================================================================
 */
export const setPreferredCard = async (req: Request, res: Response): Promise<void> => {
  const dbClient = await pool.connect()

  try {
    const { clienteId, id } = req.params

    await dbClient.query('BEGIN')

    // 1. Desmarca todos os cartões do cliente
    await dbClient.query(
      'UPDATE cartoes SET preferencial = FALSE, updated_at = CURRENT_TIMESTAMP WHERE cliente_id = $1',
      [clienteId]
    )

    // 2. Marca o cartão escolhido como preferencial
    const updateSql = `
      UPDATE cartoes 
      SET preferencial = TRUE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND cliente_id = $2
      RETURNING 
        id,
        cliente_id AS "clienteId",
        numero,
        nome_impresso AS "holder",
        bandeira AS "brand",
        codigo_seguranca AS "cvv",
        validade AS "expiry",
        preferencial
    `

    const updateResult = await dbClient.query(updateSql, [id, clienteId])

    if (updateResult.rows.length === 0) {
      await dbClient.query('ROLLBACK')
      res.status(404).json({ error: 'Cartão não encontrado para este cliente.' })
      return
    }

    await dbClient.query('COMMIT')
    res.status(200).json(updateResult.rows[0])
  } catch (error: any) {
    await dbClient.query('ROLLBACK')
    console.error('❌ Erro ao definir cartão preferencial:', error)
    res.status(500).json({ error: 'Erro ao definir cartão preferencial.' })
  } finally {
    dbClient.release()
  }
}

/**
 * ==============================================================================
 * 4. EXCLUIR CARTÃO (DELETE /api/clientes/:clienteId/cartoes/:id)
 * ==============================================================================
 */
export const deleteCard = async (req: Request, res: Response): Promise<void> => {
  const dbClient = await pool.connect()

  try {
    const { clienteId, id } = req.params

    await dbClient.query('BEGIN')

    // 1. Busca o cartão para ver se ele era o preferencial
    const checkSql = 'SELECT preferencial FROM cartoes WHERE id = $1 AND cliente_id = $2'
    const checkResult = await dbClient.query(checkSql, [id, clienteId])

    if (checkResult.rows.length === 0) {
      await dbClient.query('ROLLBACK')
      res.status(404).json({ error: 'Cartão não encontrado para exclusão.' })
      return
    }

    const wasPreferencial = checkResult.rows[0].preferencial

    // 2. Exclui o cartão
    await dbClient.query('DELETE FROM cartoes WHERE id = $1 AND cliente_id = $2', [id, clienteId])

    // 3. Se era o preferencial, promove o primeiro cartão restante como preferencial
    if (wasPreferencial) {
      const remainingSql = `
        UPDATE cartoes 
        SET preferencial = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM cartoes WHERE cliente_id = $1 ORDER BY id ASC LIMIT 1)
      `
      await dbClient.query(remainingSql, [clienteId])
    }

    await dbClient.query('COMMIT')
    res.status(200).json({ message: 'Cartão removido com sucesso.' })
  } catch (error: any) {
    await dbClient.query('ROLLBACK')
    console.error('❌ Erro ao excluir cartão:', error)
    res.status(500).json({ error: 'Erro ao excluir cartão do banco de dados.' })
  } finally {
    dbClient.release()
  }
}
