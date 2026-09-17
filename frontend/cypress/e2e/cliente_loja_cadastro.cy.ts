/**
 * ==============================================================================
 * SUÍTE DE TESTES E2E: AUTO-CADASTRO E IDENTIFICAÇÃO DO CLIENTE NA LOJA PÚBLICA
 * ==============================================================================
 * Demonstra o fluxo do cliente final realizando seu próprio cadastro na loja,
 * confirmando via Modal e visualizando seus dados em "Minha Conta".
 */

// ⏱️ CONTROLE DE VELOCIDADE DA APRESENTAÇÃO
const TYPING_SPEED = 100 
const PAUSE_TIME = 2000  

function generateRandomCPF(): string {
  const r = () => Math.floor(Math.random() * 9)
  const n = [r(), r(), r(), r(), r(), r(), r(), r(), r()]
  
  let d1 = n.reduce((total, num, i) => total + num * (10 - i), 0) % 11
  d1 = d1 < 2 ? 0 : 11 - d1
  n.push(d1)
  
  let d2 = n.reduce((total, num, i) => total + num * (11 - i), 0) % 11
  d2 = d2 < 2 ? 0 : 11 - d2
  n.push(d2)
  
  return `${n[0]}${n[1]}${n[2]}.${n[3]}${n[4]}${n[5]}.${n[6]}${n[7]}${n[8]}-${n[9]}${n[10]}`
}

describe('Fluxo do Cliente (Auto-Cadastro e Acesso)', () => {
  const timestamp = Date.now()
  const clienteLoja = {
    name: `Cliente${timestamp.toString().slice(-4)}`,
    cpf: generateRandomCPF(),
    email: `cliente${timestamp}@gmail.com`,
    phone: '11977776666',
    zipCode: '04571010',
    logradouro: 'Avenida Engenheiro Luís Carlos Berrini',
    numero: '500',
    bairro: 'Brooklin',
    cidade: 'São Paulo',
    estado: 'SP'
  }

  // ----------------------------------------------------------------------------
  // CENÁRIO 1: Auto-cadastro completo com endereço de entrega
  // ----------------------------------------------------------------------------
  it('1. Deve realizar o auto-cadastro do cliente e acessar Minha Conta', () => {
    cy.visit('/cadastro')
    cy.wait(PAUSE_TIME)

    // Valida títulos da página
    cy.contains('h1', 'Identificação & Cadastro').should('be.visible')
    cy.contains('Criar Nova Conta').should('be.visible')

    // 1. Preenche Dados Pessoais
    cy.get('input[placeholder="Ex: João da Silva"]').type(clienteLoja.name, { delay: TYPING_SPEED })
    cy.get('input[placeholder="000.000.000-00"]').last().type(clienteLoja.cpf, { delay: TYPING_SPEED })
    cy.get('input[placeholder="(00) 00000-0000"]').type(clienteLoja.phone, { delay: TYPING_SPEED })
    cy.get('input[placeholder="seu.email@exemplo.com"]').type(clienteLoja.email, { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // 2. Preenche Endereço de Entrega
    cy.get('input[placeholder="00000-000"]').first().type(clienteLoja.zipCode, { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: Av. Paulista, Rua das Flores"]').first().type(clienteLoja.logradouro, { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: 123"]').first().type(clienteLoja.numero, { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: Centro"]').first().type(clienteLoja.bairro, { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: São Paulo"]').first().type(clienteLoja.cidade, { delay: TYPING_SPEED })
    cy.get('input[placeholder="Ex: SP"]').first().type(clienteLoja.estado, { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // 3. Finaliza Cadastro
    cy.contains('button', 'Finalizar Cadastro e Continuar').click()
    cy.wait(PAUSE_TIME)

    // 4. Valida Modal de Sucesso e Clica para continuar
    cy.contains('Cadastro Concluído!').should('be.visible')
    cy.contains('button', 'OK, Acessar Minha Conta').click()
    cy.wait(PAUSE_TIME)

    // 5. Valida Área do Cliente (Minha Conta)
    cy.url().should('include', '/minha-conta')
    cy.contains('h1', 'Minha Conta').should('be.visible')
    cy.get('input[value="' + clienteLoja.name + '"]').should('be.visible')
    cy.contains(clienteLoja.logradouro).should('be.visible')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 2: Identificação rápida por CPF (Já sou cliente)
  // ----------------------------------------------------------------------------
  it('2. Deve localizar a conta existente informando apenas o CPF', () => {
    cy.visit('/cadastro')
    cy.wait(PAUSE_TIME)

    // Digita CPF no painel esquerdo "Já sou cliente"
    cy.get('input[placeholder="000.000.000-00"]').first().type(clienteLoja.cpf, { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // Clica em Localizar Conta
    cy.contains('button', 'Localizar Conta').click()
    cy.wait(PAUSE_TIME)

    // Valida que acessou a conta com os dados do cliente carregados do PostgreSQL
    cy.url().should('include', '/minha-conta')
    cy.contains('h1', 'Minha Conta').should('be.visible')
    cy.get('input[value="' + clienteLoja.name + '"]').should('be.visible')
    cy.wait(PAUSE_TIME)
  })
})
