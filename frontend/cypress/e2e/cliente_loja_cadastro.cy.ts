/**
 * ==============================================================================
 * SUÍTE DE TESTES E2E: FLUXO DO CLIENTE NA LOJA PÚBLICA
 * Módulo de Gestão de Clientes - DRS_LES_1_2026
 * ==============================================================================
 * Mapeamento dos Requisitos Cobertos:
 *  - [RF0021] Cadastrar cliente (Auto-cadastro pelo e-commerce)
 *  - [RF0022] Alterar cliente (Auto-gestão pelo perfil Minha Conta)
 *  - [RF0024] Consulta de clientes (Identificação rápida por CPF)
 *  - [RF0026] Cadastro e associação de endereços de entrega
 *  - [RN0021] Obrigatoriedade de ao menos um endereço de cobrança
 *  - [RN0022] Obrigatoriedade de ao menos um endereço de entrega
 *  - [RN0023] Composição completa do registro de endereços
 *  - [RN0026] Dados obrigatórios para cadastro de cliente
 *  - [RNF0034] Edição e manutenção independente de dados e endereços
 * ==============================================================================
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

describe('Fluxo do Cliente - Loja Pública [DRS_LES_1_2026]', () => {
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
  // CENÁRIO 1: Auto-cadastro completo com endereço de entrega (Create)
  // Requisitos: [RF0021, RN0021, RN0022, RN0023, RN0026]
  // ----------------------------------------------------------------------------
  it('[RF0021 | RN0021 | RN0022 | RN0023 | RN0026] 1. Deve realizar o auto-cadastro do cliente e acessar Minha Conta', () => {
    cy.visit('/cadastro')
    cy.wait(PAUSE_TIME)

    // Valida títulos da página
    cy.contains('h1', 'Identificação & Cadastro').should('be.visible')
    cy.contains('Criar Nova Conta').should('be.visible')

    // 1. Preenche Dados Pessoais Obrigatórios (RN0026)
    cy.get('input[placeholder="Ex: João da Silva"]').type(clienteLoja.name, { delay: TYPING_SPEED })
    cy.get('input[placeholder="000.000.000-00"]').last().type(clienteLoja.cpf, { delay: TYPING_SPEED })
    cy.get('input[placeholder="(00) 00000-0000"]').type(clienteLoja.phone, { delay: TYPING_SPEED })
    cy.get('input[placeholder="seu.email@exemplo.com"]').type(clienteLoja.email, { delay: TYPING_SPEED })
    cy.wait(PAUSE_TIME)

    // 2. Preenche Endereço de Entrega Completo (RN0022, RN0023)
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
  // Requisitos: [RF0022, RNF0034]
  // ----------------------------------------------------------------------------
  it('[RF0022 | RNF0034] 2. Deve atualizar as informações cadastrais do cliente em Minha Conta', () => {
    // Busca o cliente recém-cadastrado no PostgreSQL pelo CPF para carregar seu ID real
    cy.request('GET', `http://localhost:3001/api/clientes/cpf/${clienteLoja.cpf}`).then((response) => {
      const dbCustomer = response.body
      cy.window().then((win) => {
        win.localStorage.setItem('logged-customer', JSON.stringify(dbCustomer))
      })
    })

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

    // Valida que o telefone permaneceu atualizado na tela
    cy.contains('label', 'Telefone').parent().find('input').should('have.value', '(11) 99999-8888')
    cy.wait(PAUSE_TIME)
  })

  // ----------------------------------------------------------------------------
  // CENÁRIO 3: Identificação rápida por CPF (Já sou cliente)
  // Requisitos: [RF0024]
  // ----------------------------------------------------------------------------
  it('[RF0024] 3. Deve localizar a conta existente e carregar os dados atualizados informando apenas o CPF', () => {
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
    // Valida que o telefone retornado do PostgreSQL é o atualizado
    cy.contains('label', 'Telefone').parent().find('input').should('have.value', '(11) 99999-8888')
    cy.wait(PAUSE_TIME)
  })
})

export {}
