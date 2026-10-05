import { Request, Response } from 'express'
import { query } from '../database/db.js'

/**
 * ==============================================================================
 * 1. LISTAR TODOS OS PRODUTOS ATIVOS (GET /api/produtos)
 * Atende: RF0031 (Catálogo de Produtos para o Carrinho)
 * ==============================================================================
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        id::text AS "id",
        codigo AS "code",
        nome AS "name",
        categoria AS "category",
        fabricante AS "manufacturer",
        preco::float AS "price",
        preco_custo::float AS "costPrice",
        estoque AS "stock",
        estoque_minimo AS "minStock",
        status,
        descricao AS "description",
        imagem AS "image",
        compatibilidade AS "compatibility",
        created_at AS "createdAt"
      FROM produtos
      WHERE status = 'Ativo'
      ORDER BY id ASC
    `

    const result = await query(sql)
    res.status(200).json(result.rows)
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error)
    res.status(500).json({ error: 'Erro ao buscar catálogo de produtos no banco de dados.' })
  }
}

/**
 * ==============================================================================
 * 2. BUSCAR PRODUTO POR ID OU CÓDIGO (GET /api/produtos/:id)
 * ==============================================================================
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const sql = `
      SELECT 
        id::text AS "id",
        codigo AS "code",
        nome AS "name",
        categoria AS "category",
        fabricante AS "manufacturer",
        preco::float AS "price",
        preco_custo::float AS "costPrice",
        estoque AS "stock",
        estoque_minimo AS "minStock",
        status,
        descricao AS "description",
        imagem AS "image",
        compatibilidade AS "compatibility",
        created_at AS "createdAt"
      FROM produtos
      WHERE (id::text = $1 OR codigo = $1)
      LIMIT 1
    `

    const result = await query(sql, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado.' })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('❌ Erro ao buscar produto por ID:', error)
    res.status(500).json({ error: 'Erro ao consultar produto no banco de dados.' })
  }
}

/**
 * ==============================================================================
 * 3. RESTAURAR ESTOQUE DOS PRODUTOS (POST /api/produtos/reset)
 * Para testes E2E e demonstração com Cypress
 * ==============================================================================
 */
export const resetProductsStock = async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`
      UPDATE produtos SET estoque = 25 WHERE codigo = 'PEC-0001' OR id = 1;
      UPDATE produtos SET estoque = 4 WHERE codigo = 'PEC-0002' OR id = 2;
      UPDATE produtos SET estoque = 15 WHERE codigo = 'PEC-0003' OR id = 3;
      UPDATE produtos SET estoque = 8 WHERE codigo = 'PEC-0004' OR id = 4;
      UPDATE produtos SET estoque = 30 WHERE codigo = 'PEC-0005' OR id = 5;
      UPDATE produtos SET estoque = 6 WHERE codigo = 'PEC-0006' OR id = 6;
    `)
    res.status(200).json({ message: 'Estoque restaurado para testes!' })
  } catch (error: any) {
    console.error('❌ Erro ao resetar estoque:', error)
    res.status(500).json({ error: 'Erro ao resetar estoque.' })
  }
}
