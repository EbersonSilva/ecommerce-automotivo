/**
 * ==============================================================================
 * CYPRESS SUPPORT FILE (e2e.ts)
 * ==============================================================================
 * Este arquivo é executado automaticamente antes de cada teste E2E.
 */

// Ignora exceções não tratadas da aplicação para evitar que erros de warning parem o teste
Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

// Força o Cypress a confirmar automaticamente qualquer alert() ou confirm()
// Cypress.on('window:alert', () => true)
// Cypress.on('window:confirm', () => true)

