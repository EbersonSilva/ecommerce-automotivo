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