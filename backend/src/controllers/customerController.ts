import { Request, Response } from 'express'
import { pool, query } from '../database/db.js'

/**
 * ==============================================================================
 * CONTROLLER DE CLIENTES (CustomerController)
 * ==============================================================================
 * Aqui ficam todas as funções que recebem as requisições HTTP (Request)
 * vindas do Frontend, executam as instruções SQL no PostgreSQL e devolvem
 * a resposta (Response) em formato JSON.
 */

// ------------------------------------------------------------------------------
// 1. LISTAR TODOS OS CLIENTES (GET /api/clientes)
// ------------------------------------------------------------------------------
export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Consulta todos os clientes ordenando pelo ID crescente
    const sql = `
      SELECT 
        id, 
        codigo as "code", 
        nome as "name", 
        cpf, 
        email, 
        telefone as "phone", 
        status, 
        endereco as "address", 
        cidade as "city", 
        estado as "state", 
        cep as "zipCode",
        created_at,
        updated_at
      FROM clientes 
      ORDER BY id ASC
    `
    const result = await query(sql)

    // Retorna a lista de clientes (200 OK)
    res.status(200).json(result.rows)
  } catch (error: any) {
    console.error('❌ Erro ao buscar clientes:', error)
    res.status(500).json({ error: 'Erro interno ao consultar clientes no banco de dados.' })
  }
}

// ------------------------------------------------------------------------------
// 2. BUSCAR CLIENTE POR ID (GET /api/clientes/:id)
// ------------------------------------------------------------------------------
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const sql = `
      SELECT 
        id, 
        codigo as "code", 
        nome as "name", 
        cpf, 
        email, 
        telefone as "phone", 
        status, 
        endereco as "address", 
        cidade as "city", 
        estado as "state", 
        cep as "zipCode",
        created_at,
        updated_at
      FROM clientes 
      WHERE id = $1
    `
    const result = await query(sql, [id])

    // Se não encontrou o cliente no banco, retorna 404 (Not Found)
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Cliente não encontrado.' })
      return
    }

    // Retorna o cliente encontrado
    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('❌ Erro ao buscar cliente por ID:', error)
    res.status(500).json({ error: 'Erro interno ao buscar cliente.' })
  }
}

// ------------------------------------------------------------------------------
// 3. BUSCAR CLIENTE POR CPF (GET /api/clientes/cpf/:cpf)
// ------------------------------------------------------------------------------
export const getCustomerByCpf = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCpf = String(req.params.cpf || '')
    // Remove pontuação caso venha formatado (ex: "123.456.789-00" -> "12345678900")
    const cleanCpf = rawCpf.replace(/\D/g, '')

    const sql = `
      SELECT 
        id, 
        codigo as "code", 
        nome as "name", 
        cpf, 
        email, 
        telefone as "phone", 
        status, 
        endereco as "address", 
        cidade as "city", 
        estado as "state", 
        cep as "zipCode"
      FROM clientes 
      WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), '/', '') = $1
         OR cpf = $2
    `
    const result = await query(sql, [cleanCpf, rawCpf])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Nenhum cliente cadastrado com este CPF.' })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('❌ Erro ao buscar cliente por CPF:', error)
    res.status(500).json({ error: 'Erro interno ao consultar CPF.' })
  }
}

// ------------------------------------------------------------------------------
// 4. CADASTRAR NOVO CLIENTE (POST /api/clientes)
// ------------------------------------------------------------------------------
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, cpf, email, phone, status, address, city, state, zipCode, enderecoCobranca, enderecoEntrega } = req.body
    const cleanCpf = String(cpf || '').replace(/\D/g, '') // Remove pontuação do CPF
    const cleanPhone = String(phone || '').replace(/\D/g, '') // Remove pontuação do telefone
    const cleanZipCode = String(zipCode || '').replace(/\D/g, '') // Remove pontuação do CEP

    // Validação de campos obrigatórios
    if (!name || !cpf || !email || !phone) {
      res.status(400).json({ error: 'Nome, CPF, E-mail e Telefone são campos obrigatórios.' })
      return
    }
    // Validação de endereços obrigatórios
    if (!enderecoCobranca || !enderecoEntrega) {
      res.status(400).json({
        error: 'É obrigatório informar um endereço de cobrança e um endereço de entrega.'
      })
      return
    }

    // 1. Gera o próximo código sequencial CLI-XXXX automaticamente
    const countResult = await query('SELECT COUNT(*) FROM clientes')
    const totalClients = parseInt(countResult.rows[0].count, 10)
    const newCode = `CLI-${String(totalClients + 1).padStart(4, '0')}`

    // 2. Insere o cliente na tabela usando SQL parametrizado ($1, $2, ...)
    const sql = `
      INSERT INTO clientes (
        codigo, nome, cpf, email, telefone, status, endereco, cidade, estado, cep
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, 
        codigo as "code", 
        nome as "name", 
        cpf, 
        email, 
        telefone as "phone", 
        status, 
        endereco as "address", 
        cidade as "city", 
        estado as "state", 
        cep as "zipCode"
    `
    const values = [
      newCode,
      name,
      cleanCpf,
      email,
      cleanPhone,
      status || 'Ativo',
      address || null,
      city || null,
      state || null,
      cleanZipCode || null
    ]

    const result = await query(sql, values)

    // 201 Created: Retorna o cliente que acabou de ser inserido no PostgreSQL
    res.status(201).json(result.rows[0])
  } catch (error: any) {
    console.error('❌ Erro ao cadastrar cliente:', error)

    // Tratamento de violação de chave única (CPF ou E-mail já existentes no Postgres)
    if (error.code === '23505') {
      if (error.detail?.includes('cpf')) {
        res.status(409).json({ error: 'Este CPF já está cadastrado no sistema.' })
        return
      }
      if (error.detail?.includes('email')) {
        res.status(409).json({ error: 'Este E-mail já está cadastrado no sistema.' })
        return
      }
    }

    res.status(500).json({ error: 'Erro ao cadastrar cliente no banco de dados.' })
  }
}

// ------------------------------------------------------------------------------
// 5. ATUALIZAR CLIENTE (PUT /api/clientes/:id)
// ------------------------------------------------------------------------------
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, email, phone, status, address, city, state, zipCode } = req.body

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : phone // Remove pontuação do telefone
    const cleanZipCode = zipCode ? String(zipCode).replace(/\D/g, '') : zipCode // Remove pontuação do CEP

    const sql = `
      UPDATE clientes
      SET 
        nome = COALESCE($1, nome),
        email = COALESCE($2, email),
        telefone = COALESCE($3, telefone),
        status = COALESCE($4, status),
        endereco = COALESCE($5, endereco),
        cidade = COALESCE($6, cidade),
        estado = COALESCE($7, estado),
        cep = COALESCE($8, cep),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING 
        id, 
        codigo as "code", 
        nome as "name", 
        cpf, 
        email, 
        telefone as "phone", 
        status, 
        endereco as "address", 
        cidade as "city", 
        estado as "state", 
        cep as "zipCode",
        updated_at
    `
    const values = [name, email, cleanPhone, status, address, city, state, cleanZipCode, id]
    const result = await query(sql, values)

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Cliente não encontrado para atualização.' })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error)

    if (error.code === '23505') {
      res.status(409).json({ error: 'E-mail informado já pertence a outro cliente.' })
      return
    }

    res.status(500).json({ error: 'Erro interno ao atualizar cliente.' })
  }
}

// ------------------------------------------------------------------------------
// 6. ALTERAR STATUS DO CLIENTE (PATCH /api/clientes/:id/status)
// ------------------------------------------------------------------------------
export const updateCustomerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['Ativo', 'Inativo'].includes(status)) {
      res.status(400).json({ error: "O status deve ser 'Ativo' ou 'Inativo'." })
      return
    }

    const sql = `
      UPDATE clientes
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, codigo as "code", nome as "name", status
    `
    const result = await query(sql, [status, id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Cliente não encontrado.' })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error: any) {
    console.error('❌ Erro ao alterar status do cliente:', error)
    res.status(500).json({ error: 'Erro ao alterar status no banco de dados.' })
  }
}

// ------------------------------------------------------------------------------
// 7. EXCLUIR CLIENTE (DELETE /api/clientes/:id)
// ------------------------------------------------------------------------------
// export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params

//     const sql = 'DELETE FROM clientes WHERE id = $1 RETURNING id, nome'
//     const result = await query(sql, [id])

//     if (result.rows.length === 0) {
//       res.status(404).json({ error: 'Cliente não encontrado para exclusão.' })
//       return
//     }

//     res.status(200).json({ message: `Cliente '${result.rows[0].nome}' excluído com sucesso.` })
//   } catch (error: any) {
//     console.error('❌ Erro ao excluir cliente:', error)
//     res.status(500).json({ error: 'Erro ao excluir cliente do banco de dados.' })
//   }
// }
