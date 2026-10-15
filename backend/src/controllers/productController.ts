import { Request, Response } from 'express'
import { query } from '../database/db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * ==============================================================================
 * CONTROLLER DE PEÇAS AUTOMOTIVAS (Módulo de Produtos - DRS_LES_1_2026)
 * Atende: RF0011 a RF0016, RN0011 a RN0014
 * ==============================================================================
 */

// 1. LISTAR PRODUTOS (RF0015 - Consulta de Produtos com Filtros)
// GET /api/produtos?admin=true ou GET /api/produtos
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { admin, status, categoria } = req.query

    let sql = `
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
      WHERE 1=1
    `
    const params: any[] = []

    // Se não for admin, exibe apenas produtos ativos na loja virtual
    if (admin !== 'true' && !status) {
      sql += ` AND status = 'Ativo'`
    } else if (status && status !== 'todos') {
      params.push(status)
      sql += ` AND status = $${params.length}`
    }

    if (categoria) {
      params.push(categoria)
      sql += ` AND categoria = $${params.length}`
    }

    sql += ` ORDER BY id ASC`

    const result = await query(sql, params)
    res.status(200).json(result.rows)
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error)
    res.status(500).json({ error: 'Erro ao buscar catálogo de produtos no banco de dados.' })
  }
}

// 2. BUSCAR PRODUTO POR ID OU CÓDIGO
// GET /api/produtos/:id
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
    console.error('Erro ao buscar produto por ID:', error)
    res.status(500).json({ error: 'Erro ao consultar produto no banco de dados.' })
  }
}

// 3. CADASTRAR NOVA PEÇA AUTOMOTIVA (RF0011, RN0011, RN0012)
// POST /api/produtos
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      codigo,
      code,
      nome,
      name,
      categoria,
      category,
      fabricante,
      manufacturer,
      preco,
      price,
      precoCusto,
      costPrice,
      estoque,
      stock,
      estoqueMinimo,
      minStock,
      descricao,
      description,
      imagem,
      image,
      compatibilidade,
      compatibility
    } = req.body

    const pCode = (codigo || code || '').trim()
    const pName = (nome || name || '').trim()
    const pCategory = (categoria || category || 'Geral').trim()
    const pManufacturer = (fabricante || manufacturer || '').trim()
    const pPrice = parseFloat(preco || price || 0)
    const pCostPrice = parseFloat(precoCusto || costPrice || 0)
    const pStock = parseInt(estoque || stock || 0, 10)
    const pMinStock = parseInt(estoqueMinimo || minStock || 5, 10)
    const pDesc = (descricao || description || '').trim()
    const pImage = (imagem || image || '/products/default-part.webp').trim()
    const pCompat = Array.isArray(compatibilidade || compatibility)
      ? (compatibilidade || compatibility)
      : []

    // Validações obrigatórias
    if (!pCode || !pName || !pManufacturer) {
      res.status(400).json({ error: 'Código, nome e fabricante da peça são obrigatórios.' })
      return
    }

    // RN0012: Preço de venda deve ser maior que zero e maior ou igual ao custo
    if (pPrice <= 0 || pPrice < pCostPrice) {
      res.status(400).json({ error: 'O preço de venda não pode ser inferior ao preço de custo da peça.' })
      return
    }

    // RN0011: Verifica unicidade do código
    const checkSql = `SELECT id FROM produtos WHERE codigo = $1`
    const checkRes = await query(checkSql, [pCode])
    if (checkRes.rows.length > 0) {
      res.status(400).json({ error: `Já existe uma peça cadastrada com o código ${pCode}.` })
      return
    }

    const insertSql = `
      INSERT INTO produtos (
        codigo, nome, categoria, fabricante, preco, preco_custo,
        estoque, estoque_minimo, status, descricao, imagem, compatibilidade
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Ativo', $9, $10, $11)
      RETURNING 
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
    `

    const result = await query(insertSql, [
      pCode,
      pName,
      pCategory,
      pManufacturer,
      pPrice,
      pCostPrice,
      pStock,
      pMinStock,
      pDesc,
      pImage,
      pCompat
    ])

    console.log(`[Produtos] Nova peça cadastrada: ${pCode} - ${pName}`)
    res.status(201).json(result.rows[0])
  } catch (error: any) {
    console.error('Erro ao cadastrar produto:', error)
    res.status(500).json({ error: 'Erro ao cadastrar peça no banco de dados.', details: error.message })
  }
}

// 4. ALTERAR CADASTRO DA PEÇA (RF0014)
// PUT /api/produtos/:id
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      nome,
      name,
      categoria,
      category,
      fabricante,
      manufacturer,
      preco,
      price,
      precoCusto,
      costPrice,
      estoque,
      stock,
      estoqueMinimo,
      minStock,
      descricao,
      description,
      imagem,
      image,
      compatibilidade,
      compatibility
    } = req.body

    const pName = (nome || name || '').trim()
    const pCategory = (categoria || category || '').trim()
    const pManufacturer = (fabricante || manufacturer || '').trim()
    const pPrice = parseFloat(preco || price || 0)
    const pCostPrice = parseFloat(precoCusto || costPrice || 0)
    const pStock = parseInt(estoque || stock || 0, 10)
    const pMinStock = parseInt(estoqueMinimo || minStock || 5, 10)
    const pDesc = (descricao || description || '').trim()
    const pImage = (imagem || image || '').trim()
    const pCompat = Array.isArray(compatibilidade || compatibility)
      ? (compatibilidade || compatibility)
      : []

    if (!pName || !pCategory || !pManufacturer) {
      res.status(400).json({ error: 'Nome, categoria e fabricante são obrigatórios.' })
      return
    }

    if (pPrice <= 0 || pPrice < pCostPrice) {
      res.status(400).json({ error: 'O preço de venda não pode ser inferior ao preço de custo da peça.' })
      return
    }

    const updateSql = `
      UPDATE produtos SET
        nome = $1,
        categoria = $2,
        fabricante = $3,
        preco = $4,
        preco_custo = $5,
        estoque = $6,
        estoque_minimo = $7,
        descricao = $8,
        imagem = CASE WHEN $9 <> '' THEN $9 ELSE imagem END,
        compatibilidade = $10
      WHERE id::text = $11 OR codigo = $11
      RETURNING 
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
    `

    const result = await query(updateSql, [
      pName,
      pCategory,
      pManufacturer,
      pPrice,
      pCostPrice,
      pStock,
      pMinStock,
      pDesc,
      pImage,
      pCompat,
      id
    ])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Peça não encontrada para atualização.' })
      return
    }

    console.log(`[Produtos] Peça ID ${id} atualizada com sucesso.`)
    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error)
    res.status(500).json({ error: 'Erro ao atualizar peça no banco de dados.', details: error.message })
  }
}

// 5. ATIVAR OU INATIVAR CADASTRO (RF0012, RF0016, RN0013)
// PATCH /api/produtos/:id/status
export const updateProductStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, justificativa, motivo } = req.body

    if (!status || !['Ativo', 'Inativo'].includes(status)) {
      res.status(400).json({ error: 'Status inválido. Use "Ativo" ou "Inativo".' })
      return
    }

    const updateSql = `
      UPDATE produtos
      SET status = $1
      WHERE id::text = $2 OR codigo = $2
      RETURNING 
        id::text AS "id",
        codigo AS "code",
        nome AS "name",
        status
    `

    const result = await query(updateSql, [status, id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado.' })
      return
    }

    const justificativaMsg = justificativa || motivo || 'Alteração manual pelo administrador'
    console.log(`🔄 [Produtos] Peça ${result.rows[0].code} alterada para ${status}. Motivo: ${justificativaMsg}`)

    res.status(200).json({
      message: `Peça ${status === 'Ativo' ? 'ativada' : 'inativada'} com sucesso!`,
      product: result.rows[0],
      justificativa: justificativaMsg
    })
  } catch (error: any) {
    console.error('❌ Erro ao alterar status do produto:', error)
    res.status(500).json({ error: 'Erro ao atualizar status do produto no banco de dados.' })
  }
}

// 6. INATIVAR PEÇAS DE FORMA AUTOMÁTICA (RF0013)
// POST /api/produtos/inativar-automatico
export const autoDeactivateOutOfStock = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Inativa automaticamente produtos com estoque zerado que estejam ativos
    const sql = `
      UPDATE produtos
      SET status = 'Inativo'
      WHERE estoque = 0 AND status = 'Ativo'
      RETURNING id, codigo AS "code", nome AS "name"
    `
    const result = await query(sql)
    console.log(`Inativação automática: ${result.rowCount} peça(s) inativada(s) por falta de estoque.`)

    res.status(200).json({
      message: `Processamento concluído. ${result.rowCount} peça(s) com estoque zerado foram inativadas automaticamente.`,
      inativados: result.rows
    })
  } catch (error: any) {
    console.error('inativação automática:', error)
    res.status(500).json({ error: 'Erro ao executar inativação automática de produtos.' })
  }
}

// 7. RESTAURAR ESTOQUE DOS PRODUTOS (Para demonstrações e testes Cypress)
// POST /api/produtos/reset
export const resetProductsStock = async (_req: Request, res: Response): Promise<void> => {
  try {
    await query(`
      UPDATE produtos SET estoque = 25, status = 'Ativo' WHERE codigo = 'PEC-0001' OR id = 1;
      UPDATE produtos SET estoque = 4, status = 'Ativo' WHERE codigo = 'PEC-0002' OR id = 2;
      UPDATE produtos SET estoque = 15, status = 'Ativo' WHERE codigo = 'PEC-0003' OR id = 3;
      UPDATE produtos SET estoque = 8, status = 'Ativo' WHERE codigo = 'PEC-0004' OR id = 4;
      UPDATE produtos SET estoque = 30, status = 'Ativo' WHERE codigo = 'PEC-0005' OR id = 5;
      UPDATE produtos SET estoque = 6, status = 'Ativo' WHERE codigo = 'PEC-0006' OR id = 6;
    `)
    res.status(200).json({ message: 'Estoque restaurado para testes!' })
  } catch (error: any) {
    console.error('Erro ao resetar estoque:', error)
    res.status(500).json({ error: 'Erro ao resetar estoque.' })
  }
}

// 8. UPLOAD DE IMAGEM DA PEÇA
// Salva o arquivo fisicamente no disco e retorna APENAS o caminho para salvar no banco
// POST /api/produtos/upload-imagem
export const uploadProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileData } = req.body

    if (!fileName || !fileData) {
      res.status(400).json({ error: 'Nome do arquivo e dados da imagem (base64) são obrigatórios.' })
      return
    }

    // Valida extensões permitidas
    const ext = path.extname(fileName).toLowerCase()
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg']
    if (!allowedExts.includes(ext)) {
      res.status(400).json({ error: 'Formato de imagem inválido. Use JPG, PNG, WEBP ou SVG.' })
      return
    }

    // Extrai o conteúdo base64 sem o prefixo data:image/...;base64,
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Define o diretório de destino (frontend/public/products)
    const targetDir = path.resolve(__dirname, '../../../frontend/public/products')
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Gera um nome seguro e único para o arquivo
    const safeBaseName = path.basename(fileName, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    const uniqueFileName = `${Date.now()}-${safeBaseName}${ext}`
    const targetFilePath = path.join(targetDir, uniqueFileName)

    // Salva o arquivo no disco físico
    await fs.promises.writeFile(targetFilePath, buffer)

    // Caminho relativo que será gravado no PostgreSQL (apenas o caminho, nunca o binário)
    const savedPath = `/products/${uniqueFileName}`

    console.log(`[Upload] Imagem salva fisicamente em: ${targetFilePath}`)
    console.log(`[Upload] Caminho para salvar no banco PostgreSQL: ${savedPath}`)

    res.status(200).json({
      success: true,
      path: savedPath,
      fileName: uniqueFileName,
      message: 'Upload realizado com sucesso. Apenas o caminho foi gerado para persistência.'
    })
  } catch (error: any) {
    console.error('Erro ao fazer upload da imagem:', error)
    res.status(500).json({ error: 'Falha ao processar e salvar a imagem no servidor.' })
  }
}
