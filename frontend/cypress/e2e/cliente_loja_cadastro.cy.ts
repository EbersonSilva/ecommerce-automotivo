/**
 * ==============================================================================
 * SUÍTE DE TESTES E2E: FLUXO DO CLIENTE NA LOJA PÚBLICA
 * ==============================================================================
 * 1. Auto-Cadastro com endereço de entrega e cobrança.
 * 2. Atualização dos dados cadastrais pelo próprio cliente (Minha Conta).
 * 3. Identificação e Login rápido pelo CPF.
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

describe('Fluxo do Cliente - Loja Pública', () => {
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
    cy.contains('label', 'Nome Completo').parent().find('input').should('have.value', clienteLoja.name)
    cy.contains(clienteLoja.logradouro).should('be.visible')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 2: Atualização de Dados Cadastrais pelo Próprio Cliente (Update)
  // ----------------------------------------------------------------------------
  it('2. Deve atualizar as informações cadastrais do cliente em Minha Conta', () => {
    cy.visit('/minha-conta')
    cy.wait(PAUSE_TIME)

    // Altera o telefone para um novo número
    const novoTelefone = '11999998888'
    cy.contains('label', 'Telefone').parent().find('input').clear().type(novoTelefone, { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // Clica em Salvar Perfil
    cy.contains('button', 'Salvar Perfil').click()
    cy.wait(PAUSE_TIME)

    // Confirma o Modal de Sucesso
    cy.contains('Sucesso!').should('be.visible')
    cy.contains('button', 'OK, Entendi').click()
    cy.wait(PAUSE_TIME)

    // Valida que o telefone permaneceu atualizado
    cy.contains('label', 'Telefone').parent().find('input').should('have.value', '(11) 99999-8888')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 3: Identificação rápida por CPF (Já sou cliente)
  // ----------------------------------------------------------------------------
  it('3. Deve localizar a conta existente informando apenas o CPF', () => {
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
    cy.contains('label', 'Nome Completo').parent().find('input').should('have.value', clienteLoja.name)
    cy.wait(PAUSE_TIME)
  })
})

export {}
