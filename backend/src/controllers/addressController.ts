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