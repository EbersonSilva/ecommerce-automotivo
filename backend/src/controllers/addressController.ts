import { Request, Response } from 'express'
import { query } from '../database/db.js'

// Cria um novo endereço para um cliente específico
export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId } = req.params

    const {
      tipoEndereco,
      tipoResidencia,
      tipoLogradouro,
      logradouro,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      pais,
      observacoes
    } = req.body

    if (
      !tipoEndereco ||

      !tipoResidencia ||
      !tipoLogradouro ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cep ||
      !cidade ||
      !estado ||
      !pais
    ) {
      res.status(400).json({
        error: 'Todos os campos obrigatórios do endereço devem ser preenchidos.'
      })
      return
    }

    const cleanCep = String(cep).replace(/\D/g, '')

    if (!/^\d{8}$/.test(cleanCep)) {
      res.status(400).json({
        error: 'O CEP deve conter exatamente 8 números.'
      })
      return
    }

    const sql = `
      INSERT INTO enderecos (
        cliente_id,
        tipo_endereco,
        tipo_residencia,
        tipo_logradouro,
        logradouro,
        numero,
        bairro,
        cep,
        cidade,
        estado,
        pais,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING
        id,
        cliente_id AS "clienteId",
        tipo_endereco AS "tipoEndereco",
        tipo_residencia AS "tipoResidencia",
        tipo_logradouro AS "tipoLogradouro",
        logradouro,
        numero,
        bairro,
        cep,
        cidade,
        estado,
        pais,
        observacoes
    `

    const values = [
      clienteId,
      tipoEndereco,
      tipoResidencia,
      tipoLogradouro,
      logradouro,
      numero,
      bairro,
      cleanCep,
      cidade,
      estado,
      pais,
      observacoes || null
    ]

    const result = await query(sql, values)

    res.status(201).json(result.rows[0])
  } catch (error: any) {
    console.error('Erro ao cadastrar endereço:', error)
    res.status(500).json({
      error: 'Erro ao cadastrar endereço no banco de dados.'
    })
  }
}

// Busca todos os endereços de um cliente específico    
export const getAddressesByCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { clienteId } = req.params

    const sql = `
      SELECT
        id,
        cliente_id AS "clienteId",
        tipo_endereco AS "tipoEndereco",
        tipo_residencia AS "tipoResidencia",
        tipo_logradouro AS "tipoLogradouro",
        logradouro,
        numero,
        bairro,
        cep,
        cidade,
        estado,
        pais,
        observacoes
      FROM enderecos
      WHERE cliente_id = $1
      ORDER BY id ASC
    `

    const result = await query(sql, [clienteId])

    res.status(200).json(result.rows)
  } catch (error: any) {
    console.error('Erro ao buscar endereços:', error)
    res.status(500).json({
      error: 'Erro ao buscar endereços do cliente.'
    })
  }
}

// Atualiza um endereço existente de um cliente
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId, id } = req.params

    const {
      tipoEndereco,
      tipoResidencia,
      tipoLogradouro,
      logradouro,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      pais,
      observacoes
    } = req.body

    if (
      !tipoEndereco ||
      !tipoResidencia ||
      !tipoLogradouro ||
      !logradouro ||
      !numero ||
      !bairro ||
      !cep ||
      !cidade ||
      !estado ||
      !pais
    ) {
      res.status(400).json({
        error: 'Todos os campos obrigatórios do endereço devem ser preenchidos.'
      })
      return
    }

    const cleanCep = String(cep).replace(/\D/g, '')

    if (!/^\d{8}$/.test(cleanCep)) {
      res.status(400).json({
        error: 'O CEP deve conter exatamente 8 números.'
      })
      return
    }

    const sql = `
      UPDATE enderecos SET
        tipo_endereco = $1,
        tipo_residencia = $2,
        tipo_logradouro = $3,
        logradouro = $4,
        numero = $5,
        bairro = $6,
        cep = $7,
        cidade = $8,
        estado = $9,
        pais = $10,
        observacoes = $11
      WHERE id = $12 AND cliente_id = $13
      RETURNING
        id,
        cliente_id AS "clienteId",
        tipo_endereco AS "tipoEndereco",
        tipo_residencia AS "tipoResidencia",
        tipo_logradouro AS "tipoLogradouro",
        logradouro,
        numero,
        bairro,
        cep,
        cidade,
        estado,
        pais,
        observacoes
    `

    const values = [
      tipoEndereco,
      tipoResidencia,
      tipoLogradouro,
      logradouro,
      numero,
      bairro,
      cleanCep,
      cidade,
      estado,
      pais,
      observacoes || null,
      id,
      clienteId
    ]

    const result = await query(sql, values)

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Endereço não encontrado para este cliente.' })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('Erro ao atualizar endereço:', error)
    res.status(500).json({
      error: 'Erro ao atualizar endereço no banco de dados.'
    })
  }
}

// Exclui um endereço de um cliente garantindo a regra de negócio (mínimo de 1 de Entrega e 1 de Cobrança)
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clienteId, id } = req.params

    // 1. Busca o endereço para saber o tipo (ENTREGA ou COBRANCA)
    const findSql = `SELECT tipo_endereco AS "tipoEndereco" FROM enderecos WHERE id = $1 AND cliente_id = $2`
    const findResult = await query(findSql, [id, clienteId])

    if (findResult.rowCount === 0) {
      res.status(404).json({ error: 'Endereço não encontrado para este cliente.' })
      return
    }

    const tipoEndereco = findResult.rows[0].tipoEndereco

    // 2. Conta quantos endereços desse mesmo tipo o cliente ainda possui
    const countSql = `SELECT COUNT(*) FROM enderecos WHERE cliente_id = $1 AND tipo_endereco = $2`
    const countResult = await query(countSql, [clienteId, tipoEndereco])
    const count = parseInt(countResult.rows[0].count, 10)

    // Se for o único endereço desse tipo, bloqueia a exclusão
    if (count <= 1) {
      res.status(400).json({
        error: `Regra de Negócio: Não é permitido excluir o único endereço de ${tipoEndereco === 'ENTREGA' ? 'Entrega' : 'Cobrança'} cadastrado. Cadastre outro antes de excluir este.`
      })
      return
    }

    // 3. Executa a exclusão com segurança
    const sql = `
      DELETE FROM enderecos
      WHERE id = $1 AND cliente_id = $2
      RETURNING id
    `

    await query(sql, [id, clienteId])

    res.status(200).json({ message: 'Endereço excluído com sucesso.' })
  } catch (error: any) {
    console.error('Erro ao excluir endereço:', error)
    res.status(500).json({
      error: 'Erro ao excluir endereço no banco de dados.'
    })
  }
}

