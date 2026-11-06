/**
 * ==============================================================================
 * SUÍTE DE TESTES E2E: MÓDULO DE TROCAS & DEVOLUÇÕES (LOGÍSTICA REVERSA)
 * Sistema: E-commerce Automotivo [DRS_LES_1_2026]
 * Roteiro Obrigatório de Demonstração para Apresentação ao Professor
 * ==============================================================================
 * Mapeamento dos Requisitos e Regras Cobertos:
 *  - [RF0038] Solicitação de troca ou devolução de peça em pedido ENTREGUE
 *  - [RN0035] Fluxo de Logística Reversa:
 *      1. Solicitação pelo cliente (TROCA SOLICITADA)
 *      2. Análise e aprovação pelo Admin (TROCA ACEITA) ou recusa (TROCA NEGADA)
 *      3. Despacho da peça pelo cliente com código de rastreio (ITEM ENVIADO)
 *      4. Recebimento da mercadoria na central (ITEM RECEBIDO)
 *      5. Conclusão da troca pela administração (TROCA PROCESSADA)
 *  - [RN0036] Emissão automática de Cupom de Troca no PostgreSQL com o valor da peça
 * ==============================================================================
 */

// ⏱️ Controle de velocidade da apresentação para permitir visualização
const TYPING_SPEED = 60
const PAUSE_TIME = 1500

describe('Módulo de Trocas & Devoluções [DRS_LES_1_2026]', () => {
  const clientePadrao = {
    id: '1',
    name: 'Carlos Henrique Silva',
    cpf: '123.456.789-00',
    email: 'carlos.silva@exemplo.com',
    phone: '11988887777',
    status: 'Ativo'
  }

  beforeEach(() => {
    // Garante que o pedido ID 1 esteja com status ENTREGUE no PostgreSQL para permitir troca
    cy.request({
      method: 'PATCH',
      url: 'http://localhost:3001/api/pedidos/1/status',
      body: { status: 'ENTREGUE' },
      failOnStatusCode: false
    })

    // Configura o cliente logado no navegador
    cy.window().then((win) => {
      win.localStorage.setItem('logged-customer', JSON.stringify(clientePadrao))
    })
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 1: Cliente visualiza pedido entregue e solicita troca de autopeça
  // Requisitos: [RF0038, RN0035]
  // ----------------------------------------------------------------------------
  it('Cenário 1: Cliente solicita troca de peça em pedido ENTREGUE com preenchimento do motivo', () => {
    cy.visit('/pedidos/1')
    cy.wait(PAUSE_TIME)

    // Verifica que o botão de solicitar troca está visível para pedidos entregues
    cy.contains('button', 'Solicitar Devolução / Troca', { timeout: 8000 }).should('be.visible').click()
    cy.wait(PAUSE_TIME)

    // Preenche o formulário modal de solicitação de troca
    cy.get('input[placeholder*="Descreva o motivo"]')
      .should('be.visible')
      .type('Peça incompatível com a furação do disco traseiro do veículo.', { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // Confirma a solicitação
    cy.contains('button', 'Confirmar Solicitação').click()

    // O status do pedido passa para TROCA SOLICITADA
    cy.contains('TROCA SOLICITADA', { timeout: 6000 }).should('be.visible')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 2: Administrador visualiza solicitações e aprova a troca
  // Requisitos: [RN0035]
  // ----------------------------------------------------------------------------
  it('Cenário 2: Central Administrativa analisa e aprova a solicitação de troca', () => {
    cy.visit('/admin/trocas')
    cy.wait(PAUSE_TIME)

    // Valida que a página de trocas carregou do banco de dados
    cy.contains('h1', 'Solicitações de Trocas').should('be.visible')

    // Localiza a troca pendente e clica em Aceitar
    cy.contains('tr', 'TROCA SOLICITADA', { timeout: 8000 })
      .first()
      .within(() => {
        cy.contains('button', 'Aceitar').click()
      })

    cy.wait(PAUSE_TIME)

    // Verifica que a troca passou para status TROCA ACEITA
    cy.contains('TROCA ACEITA', { timeout: 6000 }).should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 3: Cliente despacha a mercadoria informando código de rastreamento
  // Requisitos: [RN0035]
  // ----------------------------------------------------------------------------
  it('Cenário 3: Cliente informa o código de rastreio para despacho da peça (ITEM ENVIADO)', () => {
    // Intercepta o prompt de rastreio durante o carregamento da página
    cy.visit('/minha-conta', {
      onBeforeLoad(win) {
        cy.stub(win, 'prompt').returns('BR987654321SP')
      }
    })
    cy.wait(PAUSE_TIME)

    // Acessa a aba de Devoluções / Trocas
    cy.contains('button', 'Devoluções / Trocas').click()
    cy.wait(PAUSE_TIME)

    // Clica no botão para despachar a peça que foi aceita
    cy.contains('tr', 'TROCA ACEITA', { timeout: 8000 })
      .first()
      .within(() => {
        cy.contains('button', 'Despachar Item').click()
      })

    cy.wait(PAUSE_TIME)

    // Valida que o status foi atualizado para ITEM ENVIADO no banco
    cy.contains('ITEM ENVIADO', { timeout: 8000 }).should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 4: Central Administrativa confirma recebimento e processa troca
  // Requisitos: [RN0035, RN0036] Emissão automática do Cupom de Troca
  // ----------------------------------------------------------------------------
  it('Cenário 4: Central recebe o produto, processa a troca e gera Cupom de Troca no PostgreSQL', () => {
    cy.visit('/admin/trocas')
    cy.wait(PAUSE_TIME)

    // 1. Receber o item despachado
    cy.contains('tr', 'ITEM ENVIADO', { timeout: 8000 })
      .first()
      .within(() => {
        cy.contains('button', 'Receber Item').click({ force: true })
      })

    cy.wait(PAUSE_TIME)
    cy.contains('ITEM RECEBIDO', { timeout: 6000 }).should('be.visible')

    // 2. Processar a devolução (Gera o cupom no banco via transação)
    cy.contains('tr', 'ITEM RECEBIDO', { timeout: 8000 })
      .first()
      .within(() => {
        cy.contains('button', 'Processar Cupom').click({ force: true })
      })

    cy.wait(PAUSE_TIME)

    // 3. Valida que o status final foi registrado como concluído
    cy.contains('TROCA PROCESSADA', { timeout: 6000 }).should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 5: Cliente visualiza o novo Cupom de Troca creditado em sua conta
  // Requisitos: [RN0036]
  // ----------------------------------------------------------------------------
  it('Cenário 5: Cliente verifica o Cupom de Troca creditado e disponível para novas compras', () => {
    cy.visit('/minha-conta')
    cy.wait(PAUSE_TIME)

    // Clica na aba de Cupons da conta do cliente
    cy.contains('button', 'Meus Cupons').click()
    cy.wait(PAUSE_TIME)

    // Valida que existem cupons do tipo 'Troca' disponíveis para uso
    cy.contains('Troca', { timeout: 6000 }).should('be.visible')
    cy.contains('span', 'Ativo').should('be.visible')
  })
})
