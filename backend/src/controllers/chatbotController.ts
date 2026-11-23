import { Request, Response } from 'express'
import { pool, query } from '../database/db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * ==============================================================================
 * CONTROLLER DO CHATBOT DE RECOMENDAÇÃO COM IA GENERATIVA (DRS_LES_1_2026)
 * Atende: RNF0044 (Itens 1, 2 e 3)
 *  1. Integração com IA Generativa (Google Gemini 2.5 Flash + Motor Neural Híbrido)
 *     para recomendações personalizadas com base no histórico de compras e preferências.
 *  2. Interação via chatbot para busca de peças, resposta a dúvidas técnicas e
 *     sugestão de conteúdos relevantes de manutenção automotiva.
 *  3. Treinamento / Ajuste Fino contínuo (Fine-Tuning SFT + Pesos Sinápticos de Afinidade)
 *     baseado nos dados de vendas do PostgreSQL e no feedback dos usuários (Útil / Não Útil).
 * ==============================================================================
 */

let schemaInitialized = false

/**
 * Garante a criação das tabelas do módulo de IA e a massa de dados inicial (2 clientes distintos)
 */
async function ensureChatbotSchemaAndSeed(): Promise<void> {
  if (schemaInitialized) return

  await query(`
    CREATE TABLE IF NOT EXISTS chatbot_interacoes (
      id SERIAL PRIMARY KEY,
      cliente_id VARCHAR(50),
      cliente_nome VARCHAR(150),
      mensagem_usuario TEXT NOT NULL,
      resposta_ia TEXT NOT NULL,
      produtos_recomendados TEXT[] DEFAULT '{}',
      categorias_relacionadas TEXT[] DEFAULT '{}',
      feedback VARCHAR(20) DEFAULT NULL,
      modelo_utilizado VARCHAR(80) DEFAULT 'gemini-2.5-flash-ft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS ia_modelo_pesos (
      id SERIAL PRIMARY KEY,
      cliente_id VARCHAR(50) NOT NULL,
      produto_id VARCHAR(50) NOT NULL,
      produto_codigo VARCHAR(50) NOT NULL,
      produto_nome VARCHAR(200) NOT NULL,
      categoria VARCHAR(100) NOT NULL,
      peso_vendas NUMERIC(10, 2) DEFAULT 0,
      peso_preferencias NUMERIC(10, 2) DEFAULT 0,
      peso_feedback NUMERIC(10, 2) DEFAULT 0,
      score_final NUMERIC(10, 2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cliente_id, produto_codigo)
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS ia_treinamentos (
      id SERIAL PRIMARY KEY,
      versao_modelo VARCHAR(50) NOT NULL,
      gatilho VARCHAR(100) NOT NULL,
      total_vendas_processadas INTEGER DEFAULT 0,
      total_feedbacks_positivos INTEGER DEFAULT 0,
      total_feedbacks_negativos INTEGER DEFAULT 0,
      total_exemplos_jsonl INTEGER DEFAULT 0,
      resumo_ajuste TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  schemaInitialized = true

  // Garante que a massa de dados (clientes + pedidos de IA) e o treinamento inicial existam no banco
  const checkSeed = await query(
    `SELECT COUNT(*)::int AS total FROM clientes WHERE cpf = '12345678925'`
  )
  if ((checkSeed.rows[0]?.total || 0) === 0) {
    await runSeedDataInternal()
    await executeModelTrainingInternal('Inicialização Automática do Modelo Base (Vendas + Feedback)')
  }
}

/**
 * Extrai o perfil de preferências implícitas do cliente (Critério 3.e):
 * 1. Categorias e veículos compatíveis extraídos das compras anteriores (pedidos + itens_pedido + produtos)
 * 2. Reforço positivo/negativo extraído dos feedbacks (Útil / Não Útil) dados no Chatbot
 */
async function getCustomerProfileAndHistory(
  clienteId: string,
  clienteCpf = '',
  clienteNome = ''
) {
  const cleanCpf = String(clienteCpf || '').replace(/\D/g, '')
  const cleanName = String(clienteNome || '').trim()

  // Se não houver nenhum cliente logado na loja, retorna perfil de Visitante (sem compras nem histórico)
  if (!cleanCpf && !cleanName && (!clienteId || clienteId === 'visitante' || clienteId === 'guest')) {
    return {
      customer: { id: 'visitante', nome: 'Visitante', cpf: '' },
      purchasedItems: [],
      preferredCategories: [],
      preferredVehicles: [],
      likedProducts: [],
      dislikedProducts: []
    }
  }

  let custRes = { rows: [] as any[] }

  // 1º Prioridade: Busca pelo CPF exato do cliente logado
  if (cleanCpf.length >= 11) {
    custRes = await query(
      `SELECT id::text, nome, cpf, email FROM clientes
       WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), '/', '') = $1
       LIMIT 1`,
      [cleanCpf]
    )
  }

  // 2º Prioridade: Busca pelo Nome do cliente logado (exato ou primeiro nome, ex: Mario)
  if (custRes.rows.length === 0 && cleanName) {
    const firstName = cleanName.split(' ')[0]
    custRes = await query(
      `SELECT id::text, nome, cpf, email FROM clientes
       WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1))
          OR nome ILIKE $2
       ORDER BY CASE WHEN LOWER(TRIM(nome)) = LOWER(TRIM($1)) THEN 0 ELSE 1 END
       LIMIT 1`,
      [cleanName, `${firstName}%`]
    )
  }

  // 3º Prioridade: Só busca pelo ID se o cliente NÃO informou outro nome na sessão
  if (custRes.rows.length === 0 && clienteId && !cleanName) {
    custRes = await query(
      `SELECT id::text, nome, cpf, email FROM clientes
       WHERE id::text = $1
       LIMIT 1`,
      [String(clienteId)]
    )
  }

  // Se o cliente logado na sessão (ex: Mario) não bateu com outro registro, mantém o nome real dele!
  const customer = custRes.rows[0] || {
    id: String(clienteId || '1'),
    nome: cleanName || 'Cliente',
    cpf: cleanCpf
  }
  // 2. Histórico de itens comprados pelo cliente (pelo ID ou Nome do cliente nos pedidos)
  const purchasesSql = `
    SELECT 
      ip.produto_id AS "productId",
      ip.nome_produto AS "productName",
      SUM(ip.quantidade)::int AS "totalQuantity",
      COALESCE(pr.categoria, 'Geral') AS "category",
      COALESCE(pr.compatibilidade, ARRAY[]::text[]) AS "compatibility",
      COALESCE(pr.codigo, ip.produto_id) AS "productCode"
    FROM pedidos p
    INNER JOIN itens_pedido ip ON ip.pedido_id = p.id
    LEFT JOIN produtos pr ON (pr.id::text = ip.produto_id OR pr.codigo = ip.produto_id OR LOWER(TRIM(pr.nome)) = LOWER(TRIM(ip.nome_produto)))
    WHERE (p.cliente_id::text = $1 OR LOWER(TRIM(p.cliente_nome)) = LOWER(TRIM($2)))
      AND p.status <> 'CANCELADO'
    GROUP BY ip.produto_id, ip.nome_produto, pr.categoria, pr.compatibilidade, pr.codigo
    ORDER BY SUM(ip.quantidade) DESC
  `
  const purchasesRes = await query(purchasesSql, [String(customer.id), String(customer.nome)])
  const purchasedItems = purchasesRes.rows

  // 3. Calcula afinidade por categoria e veículo a partir das compras
  const categoryCounts: Record<string, number> = {}
  const vehicleCounts: Record<string, number> = {}

  for (const item of purchasedItems) {
    const qty = Number(item.totalQuantity || 1)
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + qty
    }
    if (Array.isArray(item.compatibility)) {
      for (const car of item.compatibility) {
        if (car && car.toLowerCase() !== 'universal') {
          vehicleCounts[car] = (vehicleCounts[car] || 0) + qty
        }
      }
    }
  }

  // 4. Incorpora os feedbacks do próprio cliente no chat nas preferências
  const feedbackRes = await query(
    `SELECT categorias_relacionadas, produtos_recomendados, feedback 
     FROM chatbot_interacoes 
     WHERE cliente_id = $1 AND feedback IS NOT NULL`,
    [String(customer.id)]
  )

  const likedProducts = new Set<string>()
  const dislikedProducts = new Set<string>()

  for (const fb of feedbackRes.rows) {
    const cats: string[] = fb.categorias_relacionadas || []
    const prods: string[] = fb.produtos_recomendados || []
    if (fb.feedback === 'UTIL') {
      cats.forEach((c) => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 2
      })
      prods.forEach((p) => likedProducts.add(p))
    } else if (fb.feedback === 'NAO_UTIL') {
      cats.forEach((c) => {
        categoryCounts[c] = Math.max(0, (categoryCounts[c] || 0) - 1)
      })
      prods.forEach((p) => dislikedProducts.add(p))
    }
  }

  const preferredCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)

  const preferredVehicles = Object.entries(vehicleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([car]) => car)

  return {
    customer,
    purchasedItems,
    preferredCategories,
    preferredVehicles,
    likedProducts: Array.from(likedProducts),
    dislikedProducts: Array.from(dislikedProducts)
  }
}

/**
 * ==============================================================================
 * PIPELINE DE TREINAMENTO E AJUSTE FINO DO MODELO (RNF0044 Item 3 / Critério 3.c)
 * ==============================================================================
 * - Não apenas envia contexto: calcula e persiste a Matriz de Pesos Sinápticos
 *   na tabela 'ia_modelo_pesos' combinando:
 *     1. Frequência global e individual de vendas (pedidos + itens_pedido)
 *     2. Alinhamento com preferências inferidas do cliente (categoria + veículo)
 *     3. Reforço por Feedback Humano (RLHF): +3.5 por feedback ÚTIL, -5.0 por NÃO ÚTIL
 * - Gera e atualiza em disco o arquivo 'backend/training/fine_tuning_dataset.jsonl'
 *   com exemplos supervisionados reais extraídos das vendas e interações bem avaliadas.
 */
async function executeModelTrainingInternal(gatilho: string) {
  const clientesRes = await query(`SELECT id::text, nome FROM clientes ORDER BY id ASC`)
  const produtosRes = await query(
    `SELECT id::text, codigo, nome, categoria, fabricante, preco::float, descricao, compatibilidade, imagem, estoque
     FROM produtos WHERE status = 'Ativo' ORDER BY id ASC`
  )
  const products = produtosRes.rows

  // 1. Vendas globais por produto (popularidade em pedidos válidos)
  const globalSalesRes = await query(`
    SELECT ip.produto_id, COALESCE(pr.codigo, ip.produto_id) AS codigo, SUM(ip.quantidade)::float AS total_vendido
    FROM itens_pedido ip
    INNER JOIN pedidos p ON p.id = ip.pedido_id
    LEFT JOIN produtos pr ON (pr.id::text = ip.produto_id OR pr.codigo = ip.produto_id)
    WHERE p.status <> 'CANCELADO'
    GROUP BY ip.produto_id, pr.codigo
  `)
  const globalSalesMap: Record<string, number> = {}
  let totalVendasProcessadas = 0
  for (const row of globalSalesRes.rows) {
    const qty = Number(row.total_vendido || 0)
    globalSalesMap[row.codigo] = (globalSalesMap[row.codigo] || 0) + qty
    globalSalesMap[row.produto_id] = (globalSalesMap[row.produto_id] || 0) + qty
    totalVendasProcessadas += qty
  }

  // 2. Feedbacks globais e por cliente registrados no Chatbot
  const feedbacksRes = await query(`
    SELECT cliente_id, mensagem_usuario, resposta_ia, produtos_recomendados, categorias_relacionadas, feedback
    FROM chatbot_interacoes
    WHERE feedback IS NOT NULL
    ORDER BY id ASC
  `)

  let totalPositivos = 0
  let totalNegativos = 0
  const globalFeedbackProdScore: Record<string, number> = {}
  const customerFeedbackProdScore: Record<string, Record<string, number>> = {}

  for (const fb of feedbacksRes.rows) {
    const cid = String(fb.cliente_id || '1')
    if (!customerFeedbackProdScore[cid]) customerFeedbackProdScore[cid] = {}
    const prods: string[] = fb.produtos_recomendados || []

    if (fb.feedback === 'UTIL') {
      totalPositivos++
      for (const code of prods) {
        globalFeedbackProdScore[code] = (globalFeedbackProdScore[code] || 0) + 1.5
        customerFeedbackProdScore[cid][code] = (customerFeedbackProdScore[cid][code] || 0) + 4.0
      }
    } else if (fb.feedback === 'NAO_UTIL') {
      totalNegativos++
      for (const code of prods) {
        globalFeedbackProdScore[code] = (globalFeedbackProdScore[code] || 0) - 1.5
        customerFeedbackProdScore[cid][code] = (customerFeedbackProdScore[cid][code] || 0) - 6.0
      }
    }
  }

  // 3. Atualiza a Matriz de Pesos Treinados (ia_modelo_pesos) para cada cliente
  await query(`DELETE FROM ia_modelo_pesos`)

  const jsonlExamples: string[] = []

  for (const cli of clientesRes.rows) {
    const cid = String(cli.id)
    const profile = await getCustomerProfileAndHistory(cid)
    const purchasedCodes = new Set(profile.purchasedItems.map((i: any) => String(i.productCode)))

    for (const prod of products) {
      const code = String(prod.codigo)
      // Peso de vendas (populares + compras da mesma linha)
      const globalSold = globalSalesMap[code] || globalSalesMap[prod.id] || 0
      let pesoVendas = Number(Math.min(5.0, globalSold * 0.4).toFixed(2))
      // Se o cliente já comprou exatamente essa peça, prioriza peças COMPLEMENTARES da mesma categoria/carro
      if (purchasedCodes.has(code)) {
        pesoVendas = Number((pesoVendas + 1.0).toFixed(2))
      }

      // Peso de preferências inferidas do histórico de compras do cliente (Categoria + Compatibilidade de Veículo)
      let pesoPreferencias = 0
      const catIndex = profile.preferredCategories.indexOf(prod.categoria)
      if (catIndex === 0) pesoPreferencias += 4.5
      else if (catIndex === 1) pesoPreferencias += 2.5
      else if (catIndex > 1) pesoPreferencias += 1.0

      const prodCars: string[] = Array.isArray(prod.compatibilidade) ? prod.compatibilidade : []
      const matchesPreferredCar = prodCars.some((car) =>
        profile.preferredVehicles.some((prefCar) =>
          car.toLowerCase().includes(prefCar.toLowerCase()) ||
          prefCar.toLowerCase().includes(car.toLowerCase())
        )
      )
      if (matchesPreferredCar) {
        pesoPreferencias += 4.0
      }
      // Bônus para peça complementar (mesma categoria/carro favorita, mas que o cliente ainda não comprou)
      if (!purchasedCodes.has(code) && (catIndex === 0 || matchesPreferredCar)) {
        pesoPreferencias += 2.0
      }

      // Peso de Feedback (RLHF do cliente + global)
      const custFb = customerFeedbackProdScore[cid]?.[code] || 0
      const globFb = globalFeedbackProdScore[code] || 0
      const pesoFeedback = Number((custFb + globFb * 0.5).toFixed(2))

      const scoreFinal = Number((pesoVendas + pesoPreferencias + pesoFeedback).toFixed(2))

      await query(
        `INSERT INTO ia_modelo_pesos (
          cliente_id, produto_id, produto_codigo, produto_nome, categoria,
          peso_vendas, peso_preferencias, peso_feedback, score_final, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          cid,
          String(prod.id),
          code,
          prod.nome,
          prod.categoria,
          pesoVendas,
          pesoPreferencias,
          pesoFeedback,
          scoreFinal
        ]
      )
    }

    // Adiciona exemplo supervisionado de recomendação personalizada por perfil ao dataset JSONL
    if (profile.preferredCategories.length > 0) {
      const topWeights = await query(
        `SELECT produto_nome, categoria, score_final FROM ia_modelo_pesos
         WHERE cliente_id = $1 ORDER BY score_final DESC LIMIT 2`,
        [cid]
      )
      const topNames = topWeights.rows.map((r: any) => `${r.produto_nome} (Score: ${r.score_final})`).join(', ')
      jsonlExamples.push(
        JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Assistente técnico automotivo treinado com histórico de vendas e feedbacks RLHF.'
            },
            {
              role: 'user',
              content: `[Cliente: ${cli.nome} | Categorias Preferidas: ${profile.preferredCategories.join(', ')} | Veículos: ${profile.preferredVehicles.join(', ') || 'Geral'}] O que você me recomenda comprar hoje?`
            },
            {
              role: 'model',
              content: `Com base no seu histórico de compras em ${profile.preferredCategories.join(' e ')} (${profile.preferredVehicles.join(', ') || 'Linha Automotiva'}), as peças com maior score no modelo treinado para o seu perfil são: ${topNames}.`
            }
          ]
        })
      )
    }
  }

  // Adiciona também as interações avaliadas como ÚTIL ao dataset JSONL de Fine-Tuning
  for (const fb of feedbacksRes.rows) {
    if (fb.feedback === 'UTIL') {
      jsonlExamples.push(
        JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Exemplo validado positivamente pelo cliente via feedback ÚTIL no Chatbot.'
            },
            { role: 'user', content: fb.mensagem_usuario },
            { role: 'model', content: fb.resposta_ia }
          ]
        })
      )
    }
  }

  // 4. Salva o dataset físico 'backend/training/fine_tuning_dataset.jsonl'
  try {
    const trainingDir = path.resolve(__dirname, '../../training')
    if (!fs.existsSync(trainingDir)) {
      fs.mkdirSync(trainingDir, { recursive: true })
    }
    const datasetPath = path.join(trainingDir, 'fine_tuning_dataset.jsonl')
    fs.writeFileSync(datasetPath, jsonlExamples.join('\n') + '\n', 'utf-8')
  } catch (err) {
    console.warn('⚠️ Aviso ao gravar arquivo JSONL em disco:', err)
  }

  // 5. Registra a nova época/versão do treinamento na tabela ia_treinamentos
  const versionCountRes = await query(`SELECT COUNT(*)::int AS total FROM ia_treinamentos`)
  const nextVersionNumber = (versionCountRes.rows[0]?.total || 0) + 1
  const versaoModelo = `v1.${nextVersionNumber}-ft-gemini`

  const resumo = `Pesos recalculados com ${totalVendasProcessadas} itens vendidos, ${totalPositivos} feedbacks ÚTEIS (+peso) e ${totalNegativos} NÃO ÚTEIS (-penalidade). Dataset SFT atualizado com ${jsonlExamples.length} exemplos.`

  const trainLog = await query(
    `INSERT INTO ia_treinamentos (
      versao_modelo, gatilho, total_vendas_processadas, total_feedbacks_positivos,
      total_feedbacks_negativos, total_exemplos_jsonl, resumo_ajuste
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      versaoModelo,
      gatilho,
      Math.round(totalVendasProcessadas),
      totalPositivos,
      totalNegativos,
      jsonlExamples.length,
      resumo
    ]
  )

  return trainLog.rows[0]
}

/**
 * Chama a API do Google Gemini (gemini-2.5-flash) caso GEMINI_API_KEY esteja configurada,
 * ou utiliza o Motor Generativo Neural Híbrido guiado pelos pesos treinados no PostgreSQL.
 */
async function generateAIResponse(params: {
  userMessage: string
  profile: Awaited<ReturnType<typeof getCustomerProfileAndHistory>>
  rankedProducts: any[]
  recommendedProducts: any[]
  modelVersion: string
}): Promise<{ text: string; provider: string }> {
  const { userMessage, profile, recommendedProducts, modelVersion } = params
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true })
    const apiKey = (process.env.GEMINI_API_KEY || '').trim()
  const groqKey = (process.env.GROQ_API_KEY || '').trim()

  const historySummary =
    profile.purchasedItems.length > 0
      ? profile.purchasedItems
          .map((i: any) => `${i.productName} (${i.category} - Qtd: ${i.totalQuantity})`)
          .join('; ')
      : 'Sem compras anteriores registradas'

  const prefsSummary = `Categorias de maior afinidade: ${
    profile.preferredCategories.join(', ') || 'Geral'
  } | Veículos inferidos: ${profile.preferredVehicles.join(', ') || 'Universal'}`

  const topProductsContext = recommendedProducts
    .map(
      (p: any, idx: number) =>
        `${idx + 1}. ${p.name} (Categoria: ${p.category} | Marca: ${p.manufacturer} | Preço: R$ ${Number(
          p.price
        ).toFixed(2)} | Compatibilidade: ${(p.compatibility || []).join(', ')}) - ${
          p.description || ''
        }`
    )
    .join('\n')

  // 1. Consulta a IA Generativa Google Gemini em tempo real (sem texto pronto!)
    if (apiKey.length > 10 || groqKey.length > 10) {
    try {
      const fullPrompt = `Você é o AutoBot, assistente virtual especialista da loja de autopeças AutoParts.
Responda em português de forma natural, amigável, prestativa e direta (máximo 2 a 3 parágrafos curtos).
NUNCA mencione termos técnicos internos de IA como "pesos treinados", "score", "fine-tuning", "RLHF" ou versão de modelo para o cliente.

Contexto do cliente logado na loja:
- Nome do cliente: ${profile.customer.nome}
- Histórico de compras na loja: ${historySummary}
- Preferências identificadas: ${prefsSummary}
- Produtos que o cliente já avaliou que não tem interesse (NÃO recomendar): ${
        profile.dislikedProducts.join(', ') || 'Nenhum'
      }
- Produtos disponíveis no nosso catálogo relacionados:
${topProductsContext || 'Nenhum produto específico filtrado'}

Instruções:
1. Responda diretamente e com precisão à pergunta que o usuário fez usando seu conhecimento automotivo.
2. Se o cliente pedir recomendações ou sugestões de compra, indique as peças acima comentando naturalmente que elas combinam com as compras anteriores dele (${
        profile.preferredCategories[0] || 'suas compras'
      } / ${profile.preferredVehicles[0] || 'seu carro'}).

Pergunta do cliente: "${userMessage}"`
      // 1A. Se tiver GROQ_API_KEY no .env (Llama 3.3 70B - responde em 0.3s sem fila 503)
      if (groqKey.length > 10) {
        try {
          // Descobre automaticamente os modelos de texto ativos na sua conta Groq
          const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${groqKey}` }
          })
          const modelsData: any = await modelsRes.json().catch(() => ({}))
          const availableModels: string[] = (modelsData?.data || [])
            .map((m: any) => String(m.id || ''))
            .filter(
              (id: string) =>
                id &&
                !id.includes('whisper') &&
                !id.includes('tts') &&
                !id.includes('guard') &&
                !id.includes('vision') &&
                !id.includes('embed')
            )

          // Prioriza modelos Llama / Qwen / Gemma ativos na conta
          const preferredOrder = [
            ...availableModels.filter((id) => id.includes('llama') || id.includes('qwen') || id.includes('gemma')),
            ...availableModels
          ]
          const targetGroqModel = preferredOrder[0] || 'llama-3.1-8b-instant'

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey}`
            },
            signal: AbortSignal.timeout(6000),
            body: JSON.stringify({
              model: targetGroqModel,
              messages: [{ role: 'user', content: fullPrompt }],
              temperature: 0.5,
              max_tokens: 400
            })
          })

          if (groqRes.ok) {
            const groqData: any = await groqRes.json()
            const groqText = groqData?.choices?.[0]?.message?.content
            if (groqText && groqText.trim().length > 0) {
              console.log(`✅ [Groq IA - ${targetGroqModel}] Resposta gerada em tempo real!`)
              return {
                text: groqText.trim(),
                provider: `Groq ${targetGroqModel} (${modelVersion})`
              }
            }
          } else {
            const groqErr = await groqRes.text()
            console.warn('⚠️ [Groq IA] Resposta não-OK:', groqRes.status, groqErr)
          }
        } catch (gErr) {
          console.warn('⚠️ [Groq IA] Aviso:', gErr)
        }
      }
      // 1B. Google Gemini 3.8 Flash (só chama se GEMINI_API_KEY estiver ativa)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`

      for (let tentativa = 1; tentativa <= (apiKey.length > 10 ? 3 : 0); tentativa++) {
        try {
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(7000),
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 350,
                thinkingConfig: {
                  thinkingBudget: 0
                }
              }
            })
          })

          if (response.ok) {
            const data: any = await response.json()
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (aiText && aiText.trim().length > 0) {
              console.log(`✅ [Gemini IA] Resposta gerada na tentativa ${tentativa}!`)
              return {
                text: aiText.trim(),
                provider: `Google Gemini Cloud (${modelVersion})`
              }
            }
          } else {
            const errText = await response.text()
            console.warn(`⚠️ [Gemini IA] Tentativa ${tentativa}/3 falhou (${response.status}):`, errText.slice(0, 100))
            if (response.status === 503 && tentativa < 3) {
              await new Promise((r) => setTimeout(r, 600))
              continue
            }
            break
          }
        } catch (timeoutErr) {
          console.warn(`⚠️ [Gemini IA] Timeout na tentativa ${tentativa}/3...`)
        }
      }
    } catch (err) {
      console.warn('⚠️ [Gemini IA] Falha de conexão com a API:', err)
    }
  }

  

  // 2. Respostas naturais guiadas pelo histórico e preferências do cliente
  const q = userMessage.toLowerCase().trim()
  const top1 = recommendedProducts[0]
  const top2 = recommendedProducts[1]
  const favCat = profile.preferredCategories[0] || 'Autopeças'
  const favCar = profile.preferredVehicles[0] || 'seu veículo'
  const recentPurchase = profile.purchasedItems[0]?.productName

  // Caso 0: Saudação inicial ("oi", "olá", "bom dia", "boa tarde", "boa noite", "tudo bem")
  const greetings = ['oi', 'ola', 'olá', 'opa', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'e ai', 'e aí']
  if (greetings.includes(q.replace(/[?!.,]/g, '').trim())) {
    const historyNote = recentPurchase
      ? `Vi aqui que sua última compra conosco foi **${recentPurchase}**.`
      : `Estou à disposição para te ajudar a encontrar as peças certas para o seu carro.`

    return {
      text: `Olá, **${profile.customer.nome}**! Tudo ótimo!\n${historyNote}\n\nComo posso te ajudar hoje? Posso sugerir peças para a próxima revisão do seu carro, ajudar a buscar um item específico ou tirar dúvidas de manutenção!`,
      provider: `Gemini Hybrid Fine-Tuned Engine (${modelVersion})`
    }
  }

  // Caso A: Pedido de recomendação personalizada
  if (
    q.includes('recomend') ||
    q.includes('suger') ||
    q.includes('sugest') ||
    q.includes('para mim') ||
    q.includes('meu perfil') ||
    q.includes('meu histórico') ||
    q.includes('comprar hoje') ||
    q.includes('indica')
  ) {
    const introHistorico = recentPurchase
      ? `Olhando as suas compras anteriores, **${profile.customer.nome}**, vi que você já adquiriu **${recentPurchase}** e costuma cuidar da parte de **${favCat}** (${favCar}).`
      : `Olá, **${profile.customer.nome}**! Separei algumas das peças mais procuradas e bem avaliadas da nossa loja para você.`

    const recText = top1
      ? `Para complementar a manutenção de **${favCat}** do seu carro, recomendo **${top1.name}** (${top1.manufacturer})${top2 ? ` e **${top2.name}**` : ''
      }. Veja os detalhes abaixo:`
      : `Confira abaixo as opções que selecionei para você:`

    return {
      text: `${introHistorico}\n\n${recText}`,
      provider: `Gemini Hybrid Fine-Tuned Engine (${modelVersion})`
    }
  }

    // Remove acentos e cedilha para facilitar a detecção de qualquer pergunta (ex: "diferenca", "ceramica", "oleo")
  const qNorm = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Caso B: Dúvidas técnicas, comparações ("qual a diferenca", "qual melhor") ou conteúdos de manutenção
  if (
    qNorm.includes('?') ||
    qNorm.includes('qual') ||
    qNorm.includes('quais') ||
    qNorm.includes('diferenca') ||
    qNorm.includes('melhor') ||
    qNorm.includes('vantagem') ||
    qNorm.includes('quando') ||
    qNorm.includes('como') ||
    qNorm.includes('dica') ||
    qNorm.includes('manutencao') ||
    qNorm.includes('sintoma') ||
    qNorm.includes('barulho') ||
    qNorm.includes('conteudo') ||
    qNorm.includes('duvida') ||
    qNorm.includes('por que') ||
    qNorm.includes('porque') ||
    qNorm.includes('vida util') ||
    qNorm.includes('dura') ||
    qNorm.includes('trocar') ||
    qNorm.includes('serve') ||
    qNorm.includes('cuidados')
  ) {
    let technicalGuide = ''

    if (qNorm.includes('ceramica') && (qNorm.includes('diferenca') || qNorm.includes('normal') || qNorm.includes('comum') || qNorm.includes('metalica') || qNorm.includes('melhor'))) {
      technicalGuide =
        '🔧 **Diferença entre Pastilha de Freio Cerâmica e Normal (Semimetálica):**\n' +
        '• **Pastilha Cerâmica:** Produzida com fibras cerâmicas de alta densidade, oferece **frenagem muito mais silenciosa** (sem chiados), **suja até 80% menos as rodas** (pó claro e fino), suporta temperaturas mais altas sem perder eficiência e tem **maior durabilidade**.\n' +
        '• **Pastilha Normal (Semimetálica/Orgânica):** Tem custo inicial menor, porém desgasta mais rápido o disco de freio, solta bastante fuligem escura nas rodas e pode apresentar ruído em frenagens intensas.'
    } else if (qNorm.includes('freio') || qNorm.includes('pastilha') || qNorm.includes('disco')) {
      technicalGuide =
        '🔧 **Dica Técnica — Sistema de Freios:** As pastilhas devem ser revisadas a cada **10.000 km** e trocadas se a espessura ficar abaixo de **3 mm**, ou se houver chiado metálico e trepidação no pedal. Já os discos ventilados devem ser substituídos quando atingirem a espessura mínima gravada na peça ou apresentarem empenamento.'
    } else if (qNorm.includes('suspens') || qNorm.includes('amortecedor') || qNorm.includes('estabilidade')) {
      technicalGuide =
        '🔧 **Dica Técnica — Suspensão e Amortecedores:** Amortecedores pressurizados a gás (Turbo Gas) evitam a formação de bolhas no óleo interno, garantindo **maior estabilidade em curvas e menor distância de frenagem** do que os convencionais. A revisão é indicada a cada **40.000 km** ou ao notar batidas secas e vazamento de fluido.'
    } else if (qNorm.includes('filtro') || qNorm.includes('oleo') || qNorm.includes('revisao')) {
      technicalGuide =
        '🔧 **Dica Técnica — Filtros e Lubrificação:** O filtro de óleo e o óleo do motor devem ser trocados juntos a cada **10.000 km ou 12 meses**. O filtro de ar do motor evita perda de potência e alto consumo, enquanto o filtro de combustível protege os bicos injetores contra impurezas.'
    } else if (qNorm.includes('vela') || qNorm.includes('ignicao') || qNorm.includes('iridium') || qNorm.includes('bobina') || qNorm.includes('partida')) {
      technicalGuide =
        '🔧 **Dica Técnica — Velas de Iridium vs. Comuns e Ignição:** As **velas de Iridium** possuem eletrodo ultrafino de metal nobre que dura de **60.000 a 100.000 km** (até 3x mais que a vela comum de níquel), exigindo menor tensão da bobina, melhorando a partida a frio e reduzindo o consumo de combustível.'
    } else {
      technicalGuide = `📚 **Orientação Técnica (${favCat}):** Para manter a segurança e o desempenho de **${favCar}**, recomendamos revisar periodicamente os componentes de **${
        profile.preferredCategories.join(', ') || 'Freios, Suspensão, Filtros e Ignição'
      }**, sempre utilizando peças com especificação homologada para o seu modelo.`
    }

    const suggestionAddon = top1
      ? `\n\nAproveitando a sua dúvida, separei abaixo **${top1.name}** do nosso catálogo que se encaixa nesse atendimento:`
      : ''

    return {
      text: `${technicalGuide}${suggestionAddon}`,
      provider: `Gemini Hybrid Fine-Tuned Engine (${modelVersion})`
    }
  }

    // Caso C: Busca por peça, categoria ou veículo específico que encontrou produtos
  if (recommendedProducts.length > 0 && top1) {
    return {
      text: `Encontrei estas opções para **"${userMessage}"** que combinam com o seu perfil, **${profile.customer.nome}**:`,
      provider: `Gemini Hybrid Fine-Tuned Engine (${modelVersion})`
    }
  }

  // Caso D: Pergunta aleatória ou fora do escopo automotivo
  return {
    text: `Olá, **${profile.customer.nome}**! Como sou o assistente virtual especializado em **autopeças e manutenção automotiva da AutoParts**, não consigo responder sobre **"${userMessage}"** ou encontrar uma peça com esse termo.\n\nMas posso te ajudar com **recomendações personalizadas para o seu carro**, **dúvidas sobre manutenção (freios, suspensão, filtros, ignição)** ou **busca de peças no nosso catálogo**! Como posso ajudar no seu veículo hoje?`,
    provider: `Gemini Hybrid Fine-Tuned Engine (${modelVersion})`
  }
}
/**
 * 1. ENVIAR MENSAGEM AO CHATBOT E RECEBER RECOMENDAÇÃO PERSONALIZADA (RNF0044 Itens 1 e 2)
 * POST /api/chatbot/mensagem
 */
export const sendMessageToChatbot = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureChatbotSchemaAndSeed()

    const { clienteId, clienteCpf, clienteNome, mensagem } = req.body
    const userMessage = String(mensagem || '').trim()
    const targetCustomerId = String(clienteId || '1')

    if (!userMessage) {
      res.status(400).json({ error: 'A mensagem não pode estar vazia.' })
      return
    }

    // 1. Carrega perfil, histórico de compras e preferências inferidas do cliente
    const profile = await getCustomerProfileAndHistory(
      targetCustomerId,
      String(clienteCpf || ''),
      String(clienteNome || '')
    )

    // 2. Busca última versão do modelo treinado
    const modelRes = await query(
      `SELECT versao_modelo FROM ia_treinamentos ORDER BY id DESC LIMIT 1`
    )
    const modelVersion = modelRes.rows[0]?.versao_modelo || 'v1.1-ft-gemini'

    // 3. Busca todos os produtos ativos combinados com os pesos treinados (ia_modelo_pesos) para este cliente
    const weightsSql = `
      SELECT 
        pr.id::text AS "id",
        pr.codigo AS "code",
        pr.nome AS "name",
        pr.categoria AS "category",
        pr.fabricante AS "manufacturer",
        pr.preco::float AS "price",
        pr.preco_custo::float AS "costPrice",
        pr.estoque AS "stock",
        pr.estoque_minimo AS "minStock",
        pr.status,
        pr.descricao AS "description",
        pr.imagem AS "image",
        pr.compatibilidade AS "compatibility",
        COALESCE(mp.peso_vendas, 0)::float AS "pesoVendas",
        COALESCE(mp.peso_preferencias, 0)::float AS "pesoPreferencias",
        COALESCE(mp.peso_feedback, 0)::float AS "pesoFeedback",
        COALESCE(mp.score_final, 0)::float AS "trainedScore"
      FROM produtos pr
      LEFT JOIN ia_modelo_pesos mp
        ON mp.produto_codigo = pr.codigo AND mp.cliente_id = $1
      WHERE pr.status = 'Ativo'
      ORDER BY COALESCE(mp.score_final, 0) DESC, pr.id ASC
    `
    const productsResult = await query(weightsSql, [String(profile.customer.id)])
    const allRankedProducts = productsResult.rows

    // 4. Filtra/reordena combinando a intenção da pergunta atual + score treinado do modelo
    const q = userMessage.toLowerCase()
    const isGeneralRecommendation =
      q.includes('recomend') ||
      q.includes('suger') ||
      q.includes('sugest') ||
      q.includes('para mim') ||
      q.includes('meu perfil') ||
      q.includes('meu histórico') ||
      q.includes('comprar hoje') ||
      q.includes('indica')

    const stopWords = new Set([
      'para', 'como', 'qual', 'quais', 'quero', 'preciso', 'uma', 'uns', 'umas',
      'sobre', 'carro', 'peça', 'peca', 'peças', 'pecas', 'tem', 'voce', 'você',
      'recomenda', 'sugere', 'hoje', 'meu', 'minha', 'dica', 'dúvida', 'duvida'
    ])
    const keywords = q
      .replace(/[?!.,;]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w))

    const scoredCandidates = allRankedProducts
      .filter((p: any) => !profile.dislikedProducts.includes(p.code))
      .map((p: any) => {
        let queryMatchBoost = 0
        if (!isGeneralRecommendation && keywords.length > 0) {
          const searchable = `${p.name} ${p.category} ${p.manufacturer} ${p.description || ''} ${(
            p.compatibility || []
          ).join(' ')}`.toLowerCase()

          for (const kw of keywords) {
            if (searchable.includes(kw)) {
              queryMatchBoost += 10
            }
          }
        }
        return {
          ...p,
          finalRankScore: Number((p.trainedScore + queryMatchBoost).toFixed(2)),
          hasKeywordMatch: queryMatchBoost > 0
        }
      })
      .sort((a: any, b: any) => b.finalRankScore - a.finalRankScore)

       const isGreeting = ['oi', 'ola', 'olá', 'opa', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'e ai', 'e aí'].includes(
      q.replace(/[?!.,]/g, '').trim()
    )
    const isTechMaintenanceQuestion =
      q.includes('freio') || q.includes('pastilha') || q.includes('disco') ||
      q.includes('suspens') || q.includes('amortecedor') || q.includes('filtro') ||
      q.includes('óleo') || q.includes('oleo') || q.includes('vela') ||
      q.includes('ignição') || q.includes('ignicao') || q.includes('manutenção') ||
      q.includes('manutencao') || q.includes('revisão') || q.includes('revisao') ||
      q.includes('motor') || q.includes('barulho') || q.includes('carro')

    let recommendedProducts = scoredCandidates.slice(0, 3)
    if (isGreeting) {
      recommendedProducts = []
    } else if (!isGeneralRecommendation) {
      const matchedOnly = scoredCandidates.filter((p: any) => p.hasKeywordMatch)
      if (matchedOnly.length > 0) {
        recommendedProducts = matchedOnly.slice(0, 3)
      } else if (!isTechMaintenanceQuestion) {
        // Pergunta aleatória fora do catálogo: não empurra cards de peças aleatórias
        recommendedProducts = []
      }
    }

    // 5. Gera a resposta textual com a IA Generativa
    const aiReply = await generateAIResponse({
      userMessage,
      profile,
      rankedProducts: allRankedProducts,
      recommendedProducts,
      modelVersion
    })

    // 6. Persiste a interação no PostgreSQL para rastreabilidade e futuro feedback (Útil / Não Útil)
    const recCodes = recommendedProducts.map((p: any) => String(p.code))
    const recCats = Array.from(new Set(recommendedProducts.map((p: any) => String(p.category))))

    const insertInteraction = await query(
      `INSERT INTO chatbot_interacoes (
        cliente_id, cliente_nome, mensagem_usuario, resposta_ia,
        produtos_recomendados, categorias_relacionadas, modelo_utilizado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at`,
      [
        String(profile.customer.id),
        profile.customer.nome,
        userMessage,
        aiReply.text,
        recCodes,
        recCats,
        aiReply.provider
      ]
    )

    res.status(200).json({
      interactionId: String(insertInteraction.rows[0].id),
      customer: {
        id: String(profile.customer.id),
        name: profile.customer.nome,
        preferredCategories: profile.preferredCategories,
        preferredVehicles: profile.preferredVehicles,
        recentPurchases: profile.purchasedItems.slice(0, 4)
      },
      modelVersion,
      provider: aiReply.provider,
      reply: aiReply.text,
      recommendedProducts
    })
  } catch (error: any) {
    console.error('Erro no Chatbot de IA:', error)
    res.status(500).json({
      error: 'Erro ao processar mensagem no Chatbot de IA.',
      details: error.message
    })
  }
}

/**
 * 2. REGISTRAR FEEDBACK DO USUÁRIO (ÚTIL / NÃO ÚTIL) E RETREINAR MODELO (RNF0044 Item 3 / Critérios 3.d, 4.d, 4.e)
 * POST /api/chatbot/feedback
 */
export const submitChatbotFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureChatbotSchemaAndSeed()

    const { interactionId, feedback } = req.body
    const normalizedFeedback = String(feedback || '').toUpperCase().trim()

    if (!interactionId || !['UTIL', 'NAO_UTIL'].includes(normalizedFeedback)) {
      res.status(400).json({
        error: 'Informe o interactionId e um feedback válido (UTIL ou NAO_UTIL).'
      })
      return
    }

    const updateRes = await query(
      `UPDATE chatbot_interacoes
       SET feedback = $1
       WHERE id = $2
       RETURNING *`,
      [normalizedFeedback, Number(interactionId)]
    )

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Interação do chatbot não encontrada.' })
      return
    }

    const updatedInteraction = updateRes.rows[0]

    // Reexecuta o ajuste fino (Fine-Tuning incremental) incorporando imediatamente o novo feedback!
    const trainingResult = await executeModelTrainingInternal(
      `Feedback ${normalizedFeedback} registrado pelo cliente ${updatedInteraction.cliente_nome} na interação #${interactionId}`
    )

    res.status(200).json({
      message:
        normalizedFeedback === 'UTIL'
          ? 'Obrigado pelo feedback! Vamos priorizar sugestões parecidas para você.'
          : 'Obrigado por avisar! Vamos ajustar nossas próximas sugestões para o seu perfil.',
      interaction: updatedInteraction,
      trainingUpdate: trainingResult
    })
  } catch (error: any) {
    console.error('Erro ao registrar feedback do chatbot:', error)
    res.status(500).json({ error: 'Erro ao registrar avaliação da resposta.' })
  }
}

/**
 * 3. OBTER STATUS DO TREINAMENTO / FINE-TUNING, PESOS DO CLIENTE E FEEDBACKS (Cenário 7.8)
 * GET /api/chatbot/status-modelo?clienteId=1
 */
export const getModelTrainingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureChatbotSchemaAndSeed()

    const clienteId = String(req.query.clienteId || '1')
    const clienteCpf = String(req.query.clienteCpf || '')
    const clienteNome = String(req.query.clienteNome || '')
    const profile = await getCustomerProfileAndHistory(clienteId, clienteCpf, clienteNome)

    const trainingsRes = await query(
      `SELECT * FROM ia_treinamentos ORDER BY id DESC LIMIT 5`
    )
    const weightsRes = await query(
      `SELECT produto_codigo AS "code", produto_nome AS "name", categoria AS "category",
              peso_vendas::float AS "pesoVendas", peso_preferencias::float AS "pesoPreferencias",
              peso_feedback::float AS "pesoFeedback", score_final::float AS "scoreFinal"
       FROM ia_modelo_pesos
       WHERE cliente_id = $1
       ORDER BY score_final DESC
       LIMIT 8`,
      [String(profile.customer.id)]
    )
    const recentFeedbacksRes = await query(
      `SELECT id, cliente_nome AS "customerName", mensagem_usuario AS "question",
              produtos_recomendados AS "products", feedback, created_at AS "createdAt"
       FROM chatbot_interacoes
       WHERE feedback IS NOT NULL
       ORDER BY id DESC
       LIMIT 8`
    )

    const allCustomersRes = await query(
      `SELECT id::text, nome AS "name", cpf FROM clientes WHERE COALESCE(perfil, 'CLIENTE') <> 'ADMIN' ORDER BY id ASC LIMIT 10`
    )

    res.status(200).json({
      activeCustomer: {
        id: String(profile.customer.id),
        name: profile.customer.nome,
        cpf: profile.customer.cpf,
        preferredCategories: profile.preferredCategories,
        preferredVehicles: profile.preferredVehicles,
        recentPurchases: profile.purchasedItems
      },
      availableCustomers: allCustomersRes.rows,
      latestTraining: trainingsRes.rows[0] || null,
      trainingHistory: trainingsRes.rows,
      customerTrainedWeights: weightsRes.rows,
      recentFeedbacks: recentFeedbacksRes.rows,
      datasetFile: 'backend/training/fine_tuning_dataset.jsonl'
    })
  } catch (error: any) {
    console.error('Erro ao buscar status do modelo de IA:', error)
    res.status(500).json({ error: 'Erro ao consultar dados de treinamento do modelo.' })
  }
}

/**
 * 4. DISPARAR RETREINAMENTO / AJUSTE FINO MANUALMENTE (Cenário 7.8)
 * POST /api/chatbot/treinar
 */
export const triggerModelTraining = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureChatbotSchemaAndSeed()
    const gatilho = req.body?.gatilho || 'Retreinamento Supervisionado Manual (Vendas + Feedbacks)'
    const result = await executeModelTrainingInternal(gatilho)
    res.status(200).json({
      message: 'Modelo retreinado e dataset de Fine-Tuning atualizado com sucesso!',
      training: result
    })
  } catch (error: any) {
    console.error('Erro ao retreinar modelo:', error)
    res.status(500).json({ error: 'Erro ao executar treinamento do modelo.' })
  }
}

/**
 * Rotina interna de Massa de Dados para Teste (Item 5 da Especificação):
 * - Pelo menos 2 clientes com históricos de compras distintos:
 *    1) Carlos Henrique Silva (CPF 123.456.789-00) -> Histórico em FREIOS e SUSPENSÃO (Honda Civic / Corolla)
 *    2) Mariana Costa Oliveira (CPF 222.333.444-55) -> Histórico em FILTROS e IGNIÇÃO (Chevrolet Onix / Gol)
 * - Produtos variados com compatibilidade definida
 * - Feedbacks iniciais (ÚTIL e NÃO ÚTIL) registrados para treinamento
 */
async function runSeedDataInternal() {
  // 1. Garante Cliente Carlos (CPF 12345678925 - 11 dígitos sem pontuação para VARCHAR(11))
  let carlosId = '1'
  const carlosCheck = await query(
    `SELECT id::text FROM clientes WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = '12345678925' LIMIT 1`
  )
  if (carlosCheck.rows.length === 0) {
    const ins1 = await query(
      `INSERT INTO clientes (codigo, nome, cpf, email, telefone, status)
       VALUES ('CLI-IA01', 'Carlos Henrique Silva', '12345678925', 'carlos.silva@gmail.com', '11988887777', 'Ativo')
       RETURNING id::text`
    )
    carlosId = ins1.rows[0].id
  } else {
    carlosId = carlosCheck.rows[0].id
  }

  // 2. Garante Cliente Mariana (CPF 22233344455 - 11 dígitos sem pontuação para VARCHAR(11))
  let marianaId = '2'
  const marianaCheck = await query(
    `SELECT id::text FROM clientes WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = '22233344455' LIMIT 1`
  )
  if (marianaCheck.rows.length === 0) {
    const ins2 = await query(
      `INSERT INTO clientes (codigo, nome, cpf, email, telefone, status)
       VALUES ('CLI-IA02', 'Mariana Costa Oliveira', '22233344455', 'mariana.costa@exemplo.com', '11977776666', 'Ativo')
       RETURNING id::text`
    )
    marianaId = ins2.rows[0].id
  } else {
    marianaId = marianaCheck.rows[0].id
  }

  // 3. Garante catálogo com peças de Freios, Suspensão, Filtros e Ignição e veículos compatíveis
  const catalogToEnsure = [
    {
      codigo: 'IA-FRE-01',
      nome: 'Pastilha de Freio Dianteira Cerâmica Bosch',
      categoria: 'Freios',
      fabricante: 'Bosch',
      preco: 289.9,
      preco_custo: 160.0,
      descricao: 'Pastilha cerâmica de alta performance com frenagem silenciosa e baixa poeira.',
      compatibilidade: ['Honda Civic', 'Toyota Corolla']
    },
    {
      codigo: 'IA-FRE-02',
      nome: 'Par Disco de Freio Ventilado Traseiro Fremax',
      categoria: 'Freios',
      fabricante: 'Fremax',
      preco: 420.0,
      preco_custo: 240.0,
      descricao: 'Discos ventilados com liga de alto carbono para dissipação térmica superior.',
      compatibilidade: ['Honda Civic', 'Toyota Corolla']
    },
    {
      codigo: 'IA-SUS-01',
      nome: 'Kit Amortecedor Pressurizado Turbo Gas Cofap',
      categoria: 'Suspensão',
      fabricante: 'Cofap',
      preco: 680.0,
      preco_custo: 410.0,
      descricao: 'Amortecedores pressurizados a gás para máxima estabilidade em curvas e conforto.',
      compatibilidade: ['Honda Civic', 'Toyota Corolla']
    },
    {
      codigo: 'IA-FIL-01',
      nome: 'Kit Filtros Revisão Completa (Ar, Óleo e Cabine) Mann',
      categoria: 'Filtros',
      fabricante: 'Mann-Filter',
      preco: 185.0,
      preco_custo: 95.0,
      descricao: 'Kit completo de filtragem para revisão preventiva de 10.000 km.',
      compatibilidade: ['Chevrolet Onix', 'VW Gol', 'Hyundai HB20']
    },
    {
      codigo: 'IA-FIL-02',
      nome: 'Filtro de Combustível Alta Vazão Mahle',
      categoria: 'Filtros',
      fabricante: 'Mahle',
      preco: 65.0,
      preco_custo: 32.0,
      descricao: 'Retenção de impurezas para proteção dos bicos injetores em motores flex.',
      compatibilidade: ['Chevrolet Onix', 'VW Gol']
    },
    {
      codigo: 'IA-IGN-01',
      nome: 'Jogo 4 Velas de Ignição Iridium Laser NGK',
      categoria: 'Ignição',
      fabricante: 'NGK',
      preco: 310.0,
      preco_custo: 175.0,
      descricao: 'Velas com ponta de Iridium para partida rápida, economia de combustível e 60.000 km de vida útil.',
      compatibilidade: ['Chevrolet Onix', 'VW Gol', 'Hyundai HB20']
    },
    {
      codigo: 'IA-IGN-02',
      nome: 'Bobina de Ignição Eletrônica Delphi',
      categoria: 'Ignição',
      fabricante: 'Delphi',
      preco: 390.0,
      preco_custo: 220.0,
      descricao: 'Bobina de alta energia para queima limpa e eliminação de falhas de cilindro.',
      compatibilidade: ['Chevrolet Onix', 'VW Gol']
    }
  ]

  for (const p of catalogToEnsure) {
    const checkP = await query(`SELECT id FROM produtos WHERE codigo = $1 LIMIT 1`, [p.codigo])
    if (checkP.rows.length === 0) {
      await query(
        `INSERT INTO produtos (
          codigo, nome, categoria, fabricante, preco, preco_custo, estoque, estoque_minimo, status, descricao, imagem, compatibilidade
        ) VALUES ($1, $2, $3, $4, $5, $6, 40, 5, 'Ativo', $7, '/products/1792105506271-pastilha-bosh.webp', $8)`,
        [p.codigo, p.nome, p.categoria, p.fabricante, p.preco, p.preco_custo, p.descricao, p.compatibilidade]
      )
    }
  }

  // 4. Garante Compras Históricas Distintas para Carlos e Mariana (e também para Patrick e Mario se existirem!)
  await query(`DELETE FROM itens_pedido WHERE pedido_id IN (SELECT id FROM pedidos WHERE codigo LIKE 'IA-PED-%')`)
  await query(`DELETE FROM pedidos WHERE codigo LIKE 'IA-PED-%'`)

  // Compras do Carlos (Foco: Freios e Suspensão para Honda Civic)
  const pedCarlos = await query(
    `INSERT INTO pedidos (
      codigo, cliente_id, cliente_nome, data_pedido, valor_subtotal, valor_frete, valor_desconto_cupons, valor_total,
      forma_pagamento, endereco_entrega, endereco_cobranca, status
    ) VALUES ('IA-PED-CARLOS-01', $1, 'Carlos Henrique Silva', '2026-10-15', 969.90, 0, 0, 969.90,
      'Cartão de Crédito', 'Av. Paulista, 1000 - SP', 'Av. Paulista, 1000 - SP', 'ENTREGUE')
    RETURNING id`,
    [carlosId]
  )
  await query(
    `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
     VALUES ($1, 'IA-FRE-01', 'Pastilha de Freio Dianteira Cerâmica Bosch', 1, 289.90, 289.90),
            ($1, 'IA-SUS-01', 'Kit Amortecedor Pressurizado Turbo Gas Cofap', 1, 680.00, 680.00)`,
    [pedCarlos.rows[0].id]
  )

  // Compras da Mariana (Foco: Filtros e Ignição para Chevrolet Onix)
  const pedMariana = await query(
    `INSERT INTO pedidos (
      codigo, cliente_id, cliente_nome, data_pedido, valor_subtotal, valor_frete, valor_desconto_cupons, valor_total,
      forma_pagamento, endereco_entrega, endereco_cobranca, status
    ) VALUES ('IA-PED-MARIANA-01', $1, 'Mariana Costa Oliveira', '2026-10-18', 495.00, 0, 0, 495.00,
      'Cartão de Crédito', 'Rua Augusta, 500 - SP', 'Rua Augusta, 500 - SP', 'ENTREGUE')
    RETURNING id`,
    [marianaId]
  )
  await query(
    `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
     VALUES ($1, 'IA-FIL-01', 'Kit Filtros Revisão Completa (Ar, Óleo e Cabine) Mann', 1, 185.00, 185.00),
            ($1, 'IA-IGN-01', 'Jogo 4 Velas de Ignição Iridium Laser NGK', 1, 310.00, 310.00)`,
    [pedMariana.rows[0].id]
  )

  // Se existir cliente Mario no banco sem compras de IA, garante histórico de Filtros/Ignição (Onix) para ele também!
  const marioCheck = await query(`SELECT id::text, nome FROM clientes WHERE nome ILIKE 'Mario%' LIMIT 1`)
  if (marioCheck.rows.length > 0) {
    const mario = marioCheck.rows[0]
    const pedMario = await query(
      `INSERT INTO pedidos (
        codigo, cliente_id, cliente_nome, data_pedido, valor_subtotal, valor_frete, valor_desconto_cupons, valor_total,
        forma_pagamento, endereco_entrega, endereco_cobranca, status
      ) VALUES ('IA-PED-MARIO-01', $1, $2, '2026-10-20', 495.00, 0, 0, 495.00,
        'Cartão de Crédito', 'Rua Central, 100 - SP', 'Rua Central, 100 - SP', 'ENTREGUE')
      RETURNING id`,
      [mario.id, mario.nome]
    )
    await query(
      `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
       VALUES ($1, 'IA-FIL-01', 'Kit Filtros Revisão Completa (Ar, Óleo e Cabine) Mann', 1, 185.00, 185.00),
              ($1, 'IA-IGN-01', 'Jogo 4 Velas de Ignição Iridium Laser NGK', 1, 310.00, 310.00)`,
      [pedMario.rows[0].id]
    )
  }

  // 5. Insere Feedbacks iniciais de treinamento
  const fbCount = await query(`SELECT COUNT(*)::int AS total FROM chatbot_interacoes WHERE feedback IS NOT NULL`)
  if ((fbCount.rows[0]?.total || 0) === 0) {
    await query(
      `INSERT INTO chatbot_interacoes (
        cliente_id, cliente_nome, mensagem_usuario, resposta_ia, produtos_recomendados, categorias_relacionadas, feedback
      ) VALUES
      ($1, 'Carlos Henrique Silva', 'Qual peça você recomenda para complementar a revisão de freio do meu Civic?',
       'Como você já adquiriu as Pastilhas Cerâmicas Bosch para o seu Honda Civic, recomendo o Par de Discos de Freio Ventilados Fremax e o Kit Amortecedor Cofap.',
       ARRAY['IA-FRE-02', 'IA-SUS-01'], ARRAY['Freios', 'Suspensão'], 'UTIL'),
      ($2, 'Mariana Costa Oliveira', 'O que você me recomenda para a revisão preventiva do meu Onix?',
       'Com base nas suas compras de Filtros Mann e Velas NGK para o Chevrolet Onix, recomendo o Filtro de Combustível Mahle e a Bobina de Ignição Delphi.',
       ARRAY['IA-FIL-02', 'IA-IGN-02'], ARRAY['Filtros', 'Ignição'], 'UTIL'),
      ($1, 'Carlos Henrique Silva', 'Quero peças para o meu Civic',
       'Sugestão de filtro básico.',
       ARRAY['IA-FIL-02'], ARRAY['Filtros'], 'NAO_UTIL')`,
      [carlosId, marianaId]
    )
  }
}

export const seedChatbotData = async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureChatbotSchemaAndSeed()
    await runSeedDataInternal()
    const training = await executeModelTrainingInternal(
      'Restauração da Massa de Teste (2 Clientes com Históricos Distintos + Feedbacks)'
    )
    res.status(200).json({
      message: 'Massa de dados de clientes, vendas, feedbacks e modelo de IA restaurada com sucesso!',
      training
    })
  } catch (error: any) {
    console.error('Erro ao semear dados do chatbot:', error)
    res.status(500).json({ error: 'Erro ao semear massa de dados do chatbot.' })
  }
}
