//Configuração de mascaras de entrada para campos de formulário

// Remove pontos, traços e outros caracteres não numéricos de uma string
export function onlyNumbers(value: string){
    return value.replace(/\D/g, '')
}

// Adiciona a máscara de CPF: 000.000.000-00
export function maskCPF(value: string){
    const numbers = onlyNumbers(value).slice(0, 11)

    return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// Adiciona a máscara de telefone: (00) 00000-0000
export function maskPhone(value: string){
    const numbers = onlyNumbers(value).slice(0, 11)

    return numbers 
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskCEP(value: string){
    const numbers = onlyNumbers(value).slice(0, 8)

    return numbers
    .replace(/(\d{5})(\d)/, '$1-$2')
}

// Adiciona máscara de Cartão: 0000 0000 0000 0000
export function maskCardNumber(value: string) {
  const numbers = onlyNumbers(value).slice(0, 16)
  return numbers.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Adiciona máscara de Validade: MM/AA
export function maskCardExpiry(value: string) {
  const numbers = onlyNumbers(value).slice(0, 4)
  if (numbers.length >= 3) {
    return numbers.replace(/(\d{2})(\d{1,2})/, '$1/$2')
  }
  return numbers
}
// Limita CVV a apenas números (máximo 4 dígitos)
export function maskCVV(value: string) {
  return onlyNumbers(value).slice(0, 4)
}
