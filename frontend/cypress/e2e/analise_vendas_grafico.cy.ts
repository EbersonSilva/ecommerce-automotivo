/**
 * ==============================================================================
 * SUÍTE DE TESTES E2E: ANÁLISE DE VENDAS — GRÁFICO DE LINHAS POR CATEGORIA
 * Sistema: E-commerce Automotivo [DRS_LES_1_2026]
 * Roteiro Mínimo Obrigatório de Demonstração ao Professor (Cenários 1 a 8)
 * ==============================================================================
 * Mapeamento de Requisitos e Critérios Cobertos:
 *  - [RF0055] Analisar histórico de vendas comparando categorias por período (data início e fim)
 *  - [RNF0043] Apresentar histórico de vendas em Gráfico de Linhas agrupado por mês/ano em R$
 *  - [RNF0011] Tempo de resposta para toda consulta de usuário em no máximo 1 segundo (<= 1000ms)
 *  - Somente compras com status ENTREGUE entram no cálculo
 *  - Acesso ao gráfico restrito exclusivamente ao perfil Administrador
 * ==============================================================================
 */

const PAUSE_TIME = 1500

describe('Análise de Vendas: Gráfico de Linhas por Categoria [DRS_LES_1_2026]', () => {
  before(() => {
    // Prepara a massa de dados no PostgreSQL (várias categorias, meses 05/2026 a 10/2026 e status distintos)
    cy.request({
      method: 'POST',
      url: 'http://localhost:3001/api/relatorios/seed'
    }).its('status').should('eq', 200)
  })

  beforeEach(() => {
    // Garante perfil Administrador ativo por padrão antes de cada cenário
    cy.window().then((win) => {
      win.localStorage.setItem('user-role', 'admin')
    })
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 1: Consulta de uma categoria em um período válido, com valores
  // mensais iguais à soma das vendas ENTREGUE registradas na base.
  // Requisitos: [RF0055, RNF0043]
  // ----------------------------------------------------------------------------
  it('Cenário 1: Consulta de uma categoria em período válido com valores mensais iguais à soma das vendas ENTREGUE', () => {
    cy.visit('/admin/relatorios')
    cy.wait(PAUSE_TIME)

    // Define período de 05/2026 a 09/2026
    cy.get('[data-testid="input-data-inicio"]').clear().type('2026-05-01')
    cy.get('[data-testid="input-data-fim"]').clear().type('2026-09-30')

    // Deixa apenas a categoria "Freios" selecionada
    cy.get('[data-testid="btn-selecionar-todas-categorias"]').click()
    cy.get('[data-testid="category-option-Suspensão"]').click()
    cy.get('[data-testid="category-option-Filtros"]').click()
    cy.get('[data-testid="category-option-Ignição"]').click()

    cy.get('[data-testid="btn-consultar-periodo"]').click()
    cy.wait(PAUSE_TIME)

    // Verifica que apenas a linha da categoria Freios está no gráfico
    cy.get('[data-testid="chart-line-Freios"]').should('be.visible')
    cy.get('[data-testid="chart-line-Suspensão"]').should('not.exist')

    // Valida que os valores mensais batem com a soma exata dos pedidos ENTREGUE na base
    cy.get('[data-testid="cell-Freios-05/2026"]').should('contain.text', '900,00')
    cy.get('[data-testid="cell-Freios-06/2026"]').should('contain.text', '1.350,00')
    cy.get('[data-testid="cell-Freios-07/2026"]').should('contain.text', '1.800,00')
    cy.get('[data-testid="cell-Freios-08/2026"]').should('contain.text', '1.350,00')
    cy.get('[data-testid="cell-Freios-09/2026"]').should('contain.text', '2.250,00')
    cy.get('[data-testid="total-Freios"]').should('contain.text', '7.650,00')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 2: Comparação entre duas ou mais categorias no período.
  // Requisitos: [RF0055]
  // ----------------------------------------------------------------------------
  it('Cenário 2: Comparação simultânea entre duas ou mais categorias no período', () => {
    cy.visit('/admin/relatorios')
    cy.wait(PAUSE_TIME)

    // Seleciona todas as categorias para comparação
    cy.get('[data-testid="btn-selecionar-todas-categorias"]').click()
    cy.get('[data-testid="btn-consultar-periodo"]').click()
    cy.wait(PAUSE_TIME)

    // Verifica que múltiplas linhas de categorias estão sendo comparadas no gráfico
    cy.get('[data-testid="chart-line-Freios"]').should('be.visible')
    cy.get('[data-testid="chart-line-Suspensão"]').should('be.visible')
    cy.get('[data-testid="chart-line-Filtros"]').should('be.visible')
    cy.get('[data-testid="chart-line-Ignição"]').should('be.visible')

    // Verifica na tabela comparativa os valores de cada categoria
    cy.get('[data-testid="table-row-Freios"]').should('be.visible')
    cy.get('[data-testid="table-row-Suspensão"]').should('be.visible')
    cy.get('[data-testid="table-row-Filtros"]').should('be.visible')
    cy.get('[data-testid="table-row-Ignição"]').should('be.visible')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 3: Apresentação do resultado em gráfico de linhas, com valores
  // em reais agrupados por mês (mês/ano).
  // Requisitos: [RNF0043]
  // ----------------------------------------------------------------------------
  it('Cenário 3: Apresentação do resultado em gráfico de linhas com valores em reais agrupados por mês/ano', () => {
    cy.visit('/admin/relatorios')
    cy.wait(PAUSE_TIME)

    // Verifica que o componente SVG do Gráfico de Linhas está visível
    cy.get('[data-testid="sales-line-chart"]').should('be.visible')

    // Verifica o agrupamento no eixo horizontal por mês/ano (MM/AAAA)
    cy.get('[data-testid="chart-month-label-05/2026"]').should('be.visible')
    cy.get('[data-testid="chart-month-label-06/2026"]').should('be.visible')
    cy.get('[data-testid="chart-month-label-07/2026"]').should('be.visible')
    cy.get('[data-testid="chart-month-label-08/2026"]').should('be.visible')
    cy.get('[data-testid="chart-month-label-09/2026"]').should('be.visible')
    cy.get('[data-testid="chart-month-label-10/2026"]').should('be.visible')

    // Verifica que a medida está expressa em Reais (R$)
    cy.get('[data-testid="chart-grand-total"]').should('contain.text', 'R$')
    cy.get('[data-testid="chart-legend"]').should('contain.text', 'R$')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 4: Alteração da data de início ou de fim resultando em um novo
  // resultado no gráfico.
  // Requisitos: [RF0055]
  // ----------------------------------------------------------------------------
  it('Cenário 4: Alteração da data de início e de fim resultando em novo resultado no gráfico', () => {
    cy.visit('/admin/relatorios')
    cy.wait(PAUSE_TIME)

    // Captura o total inicial do semestre completo (05/2026 a 10/2026)
    cy.get('[data-testid="chart-grand-total"]')
      .invoke('text')
      .then((totalSemestre) => {
        // Restringe o período para 07/2026 a 08/2026
        cy.get('[data-testid="input-data-inicio"]').clear().type('2026-07-01')
        cy.get('[data-testid="input-data-fim"]').clear().type('2026-08-31')
        cy.get('[data-testid="btn-consultar-periodo"]').click()
        cy.wait(PAUSE_TIME)

        // Meses fora do novo intervalo não devem aparecer no eixo X
        cy.get('[data-testid="chart-month-label-05/2026"]').should('not.exist')
        cy.get('[data-testid="chart-month-label-10/2026"]').should('not.exist')

        // Meses dentro do novo intervalo estão visíveis
        cy.get('[data-testid="chart-month-label-07/2026"]').should('be.visible')
        cy.get('[data-testid="chart-month-label-08/2026"]').should('be.visible')

        // O valor total no gráfico mudou em relação ao período anterior
        cy.get('[data-testid="chart-grand-total"]')
          .invoke('text')
          .should('not.eq', totalSemestre)
      })

    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 5: Compra com status diferente de ENTREGUE não contabilizada no gráfico.
  // Critério: [3.d]
  // ----------------------------------------------------------------------------
  it('Cenário 5: Compras com status diferente de ENTREGUE (CANCELADO e EM TRANSPORTE) não são contabilizadas', () => {
    // Confirma no banco que existem os pedidos HIST-202609-CANC (CANCELADO, R$ 4500) e HIST-202610-PENDENTE (EM TRANSPORTE, R$ 900)
    cy.request('GET', 'http://localhost:3001/api/pedidos/HIST-202609-CANC').then((res) => {
      expect(res.body.status).to.eq('CANCELADO')
      expect(res.body.total).to.eq(4500)
    })

    cy.request('GET', 'http://localhost:3001/api/pedidos/HIST-202610-PENDENTE').then((res) => {
      expect(res.body.status).to.eq('EM TRANSPORTE')
      expect(res.body.total).to.eq(900)
    })

    cy.visit('/admin/relatorios')
    cy.wait(PAUSE_TIME)

    // Em 09/2026, Freios deve contabilizar apenas os R$ 2.250,00 ENTREGUE (ignorando os R$ 4.500,00 CANCELADO)
    cy.get('[data-testid="cell-Freios-09/2026"]').should('contain.text', '2.250,00')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 6: Compra que passa a ENTREGUE dentro do período refletida na
  // consulta seguinte.
  // Critério: [3.d]
  // ----------------------------------------------------------------------------
  it('Cenário 6: Compra que passa de EM TRANSPORTE para ENTREGUE é refletida imediatamente na consulta seguinte', () => {
    cy.visit('/admin/relatorios')
    cy.wait(PAUSE_TIME)

    // Lê o valor de Freios em 10/2026 antes da entrega do pedido HIST-202610-PENDENTE (R$ 900,00)
    cy.get('[data-testid="cell-Freios-10/2026"]')
      .invoke('text')
      .then((textoAntes) => {
        const valorAntes = parseFloat(
          textoAntes.replace(/[^\d,]/g, '').replace('.', '').replace(',', '.')
        )

        // Atualiza o pedido HIST-202610-PENDENTE para status ENTREGUE
        cy.request({
          method: 'PATCH',
          url: 'http://localhost:3001/api/pedidos/HIST-202610-PENDENTE/status',
          body: { status: 'ENTREGUE' }
        }).its('status').should('eq', 200)

        // Realiza nova consulta no gráfico
        cy.get('[data-testid="btn-consultar-periodo"]').click()
        cy.wait(PAUSE_TIME)

        // Verifica que o valor de Freios em 10/2026 aumentou em exatamente R$ 900,00
        const valorEsperado = (valorAntes + 900).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
        cy.get('[data-testid="cell-Freios-10/2026"]').should('contain.text', valorEsperado)
      })

    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 7: Acesso ao gráfico permitido ao administrador e negado a outros perfis.
  // Critério: [3.b / 4.e]
  // ----------------------------------------------------------------------------
  it('Cenário 7: Acesso ao gráfico permitido ao Administrador e negado a outros perfis', () => {
    cy.visit('/admin/relatorios')
    cy.wait(PAUSE_TIME)

    // Administrador vê o gráfico normalmente
    cy.get('[data-testid="sales-line-chart"]').should('be.visible')

    // Alterna para perfil Cliente e verifica bloqueio na interface e na API (HTTP 403)
    cy.get('[data-testid="select-user-role"]').select('cliente')
    cy.wait(PAUSE_TIME)

    cy.get('[data-testid="access-denied-container"]').should('be.visible')
    cy.contains('Acesso Restrito ao Administrador').should('be.visible')
    cy.get('[data-testid="sales-line-chart"]').should('not.exist')

    cy.request({
      method: 'GET',
      url: 'http://localhost:3001/api/relatorios/vendas-categorias',
      headers: { 'x-user-role': 'cliente' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(403)
    })

    // Volta para perfil Administrador e confirma acesso restabelecido
    cy.get('[data-testid="btn-switch-admin"]').click()
    cy.wait(PAUSE_TIME)
    cy.get('[data-testid="sales-line-chart"]').should('be.visible')
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 8: Tempo de resposta da consulta de até 1 segundo (<= 1000ms).
  // Requisito: [RNF0011]
  // ----------------------------------------------------------------------------
  it('Cenário 8: Tempo de resposta da consulta de histórico inferior a 1 segundo (<= 1000ms)', () => {
    const inicio = Date.now()

    cy.request({
      method: 'GET',
      url: 'http://localhost:3001/api/relatorios/vendas-categorias?dataInicio=2026-05-01&dataFim=2026-10-31',
      headers: { 'x-user-role': 'admin' }
    }).then((res) => {
      const duracaoTotalMs = Date.now() - inicio
      expect(res.status).to.eq(200)
      expect(res.body.responseTimeMs).to.be.lessThan(1000)
      expect(duracaoTotalMs).to.be.lessThan(1000)
    })

    cy.visit('/admin/relatorios')
    cy.get('[data-testid="btn-consultar-periodo"]').click()

    // Valida no badge da tela que o tempo em ms é menor que 1000ms
    cy.get('[data-testid="response-time-badge"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const ms = parseInt(text.replace(/\D/g, ''), 10)
        expect(ms).to.be.lessThan(1000)
      })

    cy.wait(PAUSE_TIME)
  })
})