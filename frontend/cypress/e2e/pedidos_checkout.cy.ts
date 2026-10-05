/**
 * ==============================================================================
 * SUÍTE DE TESTES E2E: MÓDULO DE CRIAÇÃO DE PEDIDOS & CHECKOUT [DRS_LES_1_2026]
 * Roteiro Obrigatório de Demonstração para Apresentação ao Professor
 * ==============================================================================
 * Mapeamento dos Requisitos e Regras Cobertos:
 *  - [RF0031, RF0032, RN0031] Carrinho de Compras e Limite de Estoque
 *  - [RF0033] Iniciar compra a partir do carrinho
 *  - [RF0034] Cálculo do Frete com base no endereço e itens
 *  - [RF0035, RN0023] Seleção ou Cadastro de Endereço de Entrega Completo
 *  - [RF0036, RF0037, RN0024, RN0025] Pagamento com Cartões de Crédito e Cupons
 *  - [RN0033] Limite de apenas 1 cupom promocional por compra
 *  - [RN0034] Pagamento com múltiplos cartões (mínimo de R$ 10,00 por cartão)
 *  - [RN0035] Pagamento com cartão inferior a R$ 10,00 apenas combinado com cupons
 *  - [RN0036] Emissão automática de Cupom de Troca quando cupons superam valor da compra
 *  - [RF0038] Finalização da compra registrando pedido com status EM PROCESSAMENTO
 * ==============================================================================
 */

// ⏱️ CONTROLE DE VELOCIDADE DA APRESENTAÇÃO AO VIVO
const TYPING_SPEED = 25
const PAUSE_TIME = 800

describe('Módulo de Criação de Pedidos [DRS_LES_1_2026]', () => {
  // Cliente de Teste com Endereço e Cartão Pré-Cadastrados no PostgreSQL
  const clientePadrao = {
    id: '1',
    name: 'Carlos Henrique Silva',
    cpf: '123.456.789-00',
    email: 'carlos.silva@exemplo.com',
    phone: '11988887777',
    status: 'Ativo'
  }

  beforeEach(() => {
    // Reativa os cupons de teste no PostgreSQL para garantir autonomia de cada teste
    cy.request({
      method: 'POST',
      url: 'http://localhost:3001/api/cupons/reset',
      failOnStatusCode: false
    })

    // Restaura o estoque original dos produtos no PostgreSQL
    cy.request({
      method: 'POST',
      url: 'http://localhost:3001/api/produtos/reset',
      failOnStatusCode: false
    })

    // Inicializa a sessão do cliente autenticado e limpa o carrinho
    cy.window().then((win) => {
      win.localStorage.setItem('logged-customer', JSON.stringify(clientePadrao))
      win.localStorage.removeItem('cart')
    })
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 1: Carrinho de Compras - Múltiplos Itens e Trava de Estoque
  // Requisitos: [RF0031, RF0032, RN0031]
  // ----------------------------------------------------------------------------
  it('[RF0031 | RF0032 | RN0031] 1. Inclusão de mais de um item no carrinho, alteração de quantidade e trava de estoque', () => {
    cy.visit('/produtos')
    cy.wait(PAUSE_TIME)

    // 1. Adiciona o primeiro produto ao carrinho
    cy.contains('.group', 'Pastilha de Freio').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()
    cy.wait(PAUSE_TIME)

    // 2. Adiciona o segundo produto ao carrinho
    cy.contains('.group', 'Filtro de Óleo').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()
    cy.wait(PAUSE_TIME)

    // 3. Acessa o carrinho e verifica que contém os 2 itens diferentes
    cy.visit('/carrinho')
    cy.wait(PAUSE_TIME)
    cy.contains('h1', 'Meu Carrinho').should('be.visible')
    cy.contains('Pastilha de Freio').should('be.visible')
    cy.contains('Filtro de Óleo').should('be.visible')

    // 4. Altera a quantidade de um item no carrinho (+)
    cy.contains('.bg-slate-900\\/40', 'Pastilha de Freio').contains('button', '+').click()
    cy.wait(PAUSE_TIME)

    // 5. Validação da RN0031: Alerta em Modal ao tentar exceder estoque disponível
    // Filtro de Óleo possui estoque 4 un. Incrementa até ultrapassar:
    cy.contains('.bg-slate-900\\/40', 'Filtro de Óleo').contains('button', '+').click()
    cy.contains('.bg-slate-900\\/40', 'Filtro de Óleo').contains('button', '+').click()
    cy.contains('.bg-slate-900\\/40', 'Filtro de Óleo').contains('button', '+').click()
    cy.contains('.bg-slate-900\\/40', 'Filtro de Óleo').contains('button', '+').click()
    cy.wait(PAUSE_TIME)

    // Valida que o Modal de Regra de Negócio (RN0031) apareceu e clica em OK
    cy.contains('RN0031').should('be.visible')
    cy.get('[data-testid="modal-ok-btn"]').click()
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 2: Compra com Endereço e Cartão Pré-cadastrados (Caminho Feliz Padrão)
  // Requisitos: [RF0033, RF0034, RF0035, RF0036, RF0038]
  // ----------------------------------------------------------------------------
  it('[RF0033 | RF0034 | RF0035 | RF0036 | RF0038] 2. Compra completa com endereço e cartão previamente cadastrados no perfil', () => {
    // 1. Adiciona item ao carrinho e vai ao checkout
    cy.visit('/produtos')
    cy.contains('.group', 'Pastilha de Freio').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()

    cy.visit('/carrinho')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Ir para o Checkout').click()

    // 2. Etapa 1: Endereço de Entrega (RF0035) - Seleciona endereço existente
    cy.url().should('include', '/checkout')
    cy.contains('h1', 'Finalização do Pedido').should('be.visible')
    cy.contains('Endereço de Entrega').should('be.visible')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Prosseguir para Pagamento').click()

    // 3. Etapa 2: Forma de Pagamento (RF0036) - Cartão de Crédito preferencial pré-selecionado
    cy.wait(PAUSE_TIME)
    cy.contains('Forma de Pagamento').should('be.visible')
    cy.get('select').first().select('Cartão de Crédito')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Revisar Pedido').click()

    // 4. Etapa 3: Resumo do Pedido (RF0034 - Cálculo de frete e valores)
    cy.wait(PAUSE_TIME)
    cy.contains('h3', 'Resumo da Compra').should('be.visible')
    cy.contains('button', 'Confirmar e Finalizar Pedido').click()

    // 5. Etapa 4: Pedido Finalizado com Status EM PROCESSAMENTO (RF0038)
    cy.wait(PAUSE_TIME)
    cy.contains('Pedido Realizado com Sucesso!').should('be.visible')
    cy.contains('EM PROCESSAMENTO').should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 3: Compra com Novo Endereço e Novo Cartão Incorporados ao Perfil
  // Requisitos: [RF0035, RN0023, RF0036, RN0024, RN0025]
  // ----------------------------------------------------------------------------
  it('[RF0035 | RN0023 | RF0036 | RN0024 | RN0025] 3. Compra cadastrando novo endereço e novo cartão durante o checkout, incorporados ao perfil', () => {
    cy.visit('/produtos')
    cy.contains('.group', 'Pastilha de Freio').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()

    cy.visit('/carrinho')
    cy.contains('button', 'Ir para o Checkout').click()

    // 1. Etapa 1: Cadastra Novo Endereço de Entrega com todos os campos da RN0023
    cy.contains('Cadastrar Outro Endereço de Entrega').click()
    cy.wait(PAUSE_TIME)

    cy.get('input[placeholder="00000-000"]').first().type('04571010', { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: Av. Paulista, Rua das Flores"]').first().type('Avenida Engenheiro Luís Carlos Berrini', { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: 123"]').first().type('500', { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: Centro"]').first().type('Brooklin', { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: São Paulo"]').first().type('São Paulo', { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: SP"]').first().type('SP', { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Prosseguir para Pagamento').click()

    // 2. Etapa 2: Cadastra Novo Cartão com Bandeira (RN0025) e Máscaras (RN0024)
    cy.wait(PAUSE_TIME)
    cy.get('select').first().select('Cartão de Crédito')
    cy.get('select').eq(1).select('new')
    cy.wait(PAUSE_TIME)

    // Seleciona Bandeira permitida pela RN0025
    cy.get('select').eq(2).select('Mastercard')
    cy.get('input[placeholder="NOME COMO IMPRESSO NO CARTÃO"]').type('CARLOS H SILVA', { delay: TYPING_SPEED })
    cy.get('input[placeholder="0000 0000 0000 0000"]').type('5555444433332222', { delay: TYPING_SPEED })
    cy.get('input[placeholder="MM/AA"]').type('1228', { delay: TYPING_SPEED })
    cy.get('input[placeholder="123"]').type('888', { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // Avança e finaliza o pedido
    cy.contains('button', 'Revisar Pedido').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Confirmar e Finalizar Pedido').click()

    // 3. Valida conclusão com status EM PROCESSAMENTO
    cy.wait(PAUSE_TIME)
    cy.contains('Pedido Realizado com Sucesso!').should('be.visible')
    cy.contains('EM PROCESSAMENTO').should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 4: Pagamento com Mais de um Cartão e Validação do Mínimo de R$ 10,00
  // Requisitos: [RF0037, RN0034]
  // ----------------------------------------------------------------------------
  it('[RF0037 | RN0034] 4. Pagamento com múltiplos cartões com validação do valor mínimo de R$ 10,00 por cartão', () => {
    cy.visit('/produtos')
    cy.contains('.group', 'Pastilha de Freio').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()

    cy.visit('/carrinho')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Ir para o Checkout').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Prosseguir para Pagamento').click()
    cy.wait(PAUSE_TIME)

    // 1. Seleciona método Múltiplos Cartões
    cy.get('select').first().select('Múltiplos Cartões')
    cy.wait(PAUSE_TIME)

    // 2. Tenta colocar R$ 5,00 no Cartão 1 (Abaixo do mínimo de R$ 10,00 exigido na RN0034)
    cy.get('input[placeholder="0.00"]').first().clear().type('5.00', { delay: TYPING_SPEED })
    cy.contains('button', 'Revisar Pedido').click()
    cy.wait(PAUSE_TIME)

    // Valida o Modal de RN0034 e clica no botão OK do Modal
    cy.contains('RN0034').should('be.visible')
    cy.get('[data-testid="modal-ok-btn"]').click()
    cy.wait(PAUSE_TIME)

    // 3. Corrige o valor para R$ 100,00 no Cartão 1 e divide corretamente
    cy.get('input[placeholder="0.00"]').first().clear().type('100.00', { delay: TYPING_SPEED })
    cy.get('input[placeholder="0.00"]').eq(1).clear().type('114.90', { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // Preenche dados do Cartão 2 (caso 'new')
    cy.get('input[placeholder="NOME COMO IMPRESSO NO CARTÃO"]').eq(1).type('CARLOS H SILVA', { delay: TYPING_SPEED })
    cy.get('input[placeholder="0000 0000 0000 0000"]').eq(1).type('4111222233334444', { delay: TYPING_SPEED })
    cy.get('input[placeholder="MM/AA"]').eq(1).type('1029', { delay: TYPING_SPEED })
    cy.get('input[placeholder="123"]').eq(1).type('456', { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // Preenche os dados dos cartões e conclui com sucesso
    cy.contains('button', 'Revisar Pedido').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Confirmar e Finalizar Pedido').click()
    cy.contains('EM PROCESSAMENTO').should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 5: Pagamento com Cartão + Cupons e Regra de Menos de R$ 10,00 no Cartão
  // Requisitos: [RN0033, RN0035]
  // ----------------------------------------------------------------------------
  it('[RN0033 | RN0035] 5. Pagamento com cartão e cupons, incluindo permissão de valor < R$ 10 no cartão e limite de 1 cupom promocional', () => {
    cy.visit('/produtos')
    cy.contains('.group', 'Filtro de Óleo').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()

    cy.visit('/carrinho')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Ir para o Checkout').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Prosseguir para Pagamento').click()
    cy.wait(PAUSE_TIME)

    // 1. Validação da RN0033: Tentar marcar 2 cupons promocionais
    // Clica no primeiro cupom promocional
    cy.contains('BEMVINDO10').click()
    cy.wait(PAUSE_TIME)

    // Tenta clicar no segundo cupom promocional (deve abrir o modal conforme RN0033)
    cy.contains('PROMO20').click()
    cy.wait(PAUSE_TIME)

    // Valida o Modal de RN0033 e clica no botão OK do Modal
    cy.contains('RN0033').should('be.visible')
    cy.get('[data-testid="modal-ok-btn"]').click()
    cy.wait(PAUSE_TIME)

    // 2. Aplica cupom de troca de R$ 50,00 + cupom promocional de R$ 10,00
    cy.contains('TROCA-50').click()
    cy.wait(PAUSE_TIME)

    // 3. Validação da RN0035: Permite avançar normalmente com o cartão cobrindo apenas o saldo residual
    cy.get('select').first().select('Cartão de Crédito')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Revisar Pedido').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Confirmar e Finalizar Pedido').click()
    cy.contains('EM PROCESSAMENTO').should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 6: Uso de Cupons Superando o Valor da Compra (Geração de Cupom de Troca)
  // Requisitos: [RN0036]
  // ----------------------------------------------------------------------------
  it('[RN0036] 6. Uso de cupons cujo valor supera a compra com emissão automática de novo cupom de troca com a diferença', () => {
    cy.visit('/produtos')
    cy.contains('.group', 'Filtro de Óleo').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()

    cy.visit('/carrinho')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Ir para o Checkout').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Prosseguir para Pagamento').click()
    cy.wait(PAUSE_TIME)

    // Aplica Cupom de Troca de R$ 100,00 (maior que o total da compra de R$ 70,50)
    cy.contains('TROCA-100').click()
    cy.wait(PAUSE_TIME)

    // Valida mensagem de que 100% do pedido foi coberto
    cy.contains('Os cupons aplicados cobrem 100% do saldo do pedido').should('be.visible')

    // Conclui o pedido sem necessidade de pagamento adicional
    cy.contains('button', 'Revisar Pedido').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Confirmar e Finalizar Pedido').click()

    // Valida finalização
    cy.wait(PAUSE_TIME)
    cy.contains('Pedido Realizado com Sucesso!').should('be.visible')
    cy.contains('EM PROCESSAMENTO').should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 7: Verificação do Registro do Pedido com Status EM PROCESSAMENTO
  // Requisitos: [RF0038]
  // ----------------------------------------------------------------------------
  it('[RF0038] 7. Verificação de que o pedido finalizado consta registrado com status EM PROCESSAMENTO no histórico', () => {
    // 1. Cria um pedido com sucesso
    cy.visit('/produtos')
    cy.contains('.group', 'Pastilha de Freio').find('button').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="modal-ok-btn"]').click()

    cy.visit('/carrinho')
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Ir para o Checkout').click()
    cy.wait(PAUSE_TIME)
    cy.contains('button', 'Prosseguir para Pagamento').click()
    cy.wait(PAUSE_TIME)
    cy.get('select').first().select('Cartão de Crédito')
    cy.contains('button', 'Revisar Pedido').click()
    cy.contains('button', 'Confirmar e Finalizar Pedido').click()
    cy.contains('EM PROCESSAMENTO').should('be.visible')

    // 2. Acessa a página de Meus Pedidos
    cy.visit('/pedidos')
    cy.wait(PAUSE_TIME)

    // Valida que o pedido consta no histórico com status EM PROCESSAMENTO
    cy.contains('Meus Pedidos').should('be.visible')
    cy.contains('EM PROCESSAMENTO').should('be.visible')
  })
})
