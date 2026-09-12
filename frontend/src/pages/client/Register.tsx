import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { mockCustomers } from '../../mock/mockData'
import type { Customer } from '../../mock/mockData'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import {
  ArrowLeft, UserPlus, Search, ShieldCheck, User, MapPin, Sparkles, CheckCircle2, Truck, Ticket
} from 'lucide-react'
import { getCustomerByCpf, createCustomer } from '../../services/customerService'
import { maskCPF, maskPhone, maskCEP, onlyNumbers } from '../../utils/inputMasks' // Importa a função de máscara de CPF

const tipoResidenciaOptions = [
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'CONDOMINIO', label: 'Condomínio' },
  { value: 'OUTRO', label: 'Outro' },
]

const tipoLogradouroOptions = [
  { value: 'Rua', label: 'Rua' },
  { value: 'Avenida', label: 'Avenida' },
  { value: 'Alameda', label: 'Alameda' },
  { value: 'Travessa', label: 'Travessa' },
  { value: 'Largo', label: 'Largo' },
  { value: 'Beco', label: 'Beco' },
]

/**
 * ==============================================================================
 * TELA: CADASTRO E IDENTIFICAÇÃO DO CLIENTE
 * ==============================================================================
 * Permite que um cliente:
 * 1. Se identifique pelo CPF (fazendo SELECT no PostgreSQL).
 * 2. Crie uma nova conta (fazendo INSERT no PostgreSQL).
 */
export const Register: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Verifica se o usuário foi redirecionado a partir do checkout
  const fromCheckout = location.state?.from === '/checkout'

  // Estados da Busca por CPF (Identificação)
  const [searchCpf, setSearchCpf] = useState('')
  const [idError, setIdError] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Estados do Formulário de Novo Cadastro
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [tipoResidencia, setTipoResidencia] = useState('Casa')
  const [tipoLogradouro, setTipoLogradouro] = useState('Rua')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [pais, setPais] = useState('Brasil')
  const [isRegistering, setIsRegistering] = useState(false)

  /**
   * FUNÇÃO 1: Identificar Cliente por CPF no PostgreSQL
   */
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIdError('')

    const queryCpf = onlyNumbers(searchCpf)
    if (!queryCpf) {
      setIdError('Por favor, informe seu CPF.')
      return
    }

    setIsSearching(true)
    try {
      // 1. Tenta buscar da API do PostgreSQL
      const found = await getCustomerByCpf(queryCpf)

      if (found.status === 'Inativo') {
        setIdError('Este cadastro está inativo. Entre em contato com o suporte da loja.')
        return
      }

      // Salva sessão local no navegador
      localStorage.setItem('logged-customer', JSON.stringify(found))
      window.dispatchEvent(new Event('auth-change'))

      alert(`Bem-vindo de volta, ${found.name}!`)
      navigate(fromCheckout ? '/checkout' : '/minha-conta')
    } catch (err: any) {
      console.warn('⚠️ Tentando fallback local para busca de CPF...', err)

      // Fallback local se a API estiver fora
      try {
        const saved = localStorage.getItem('custom-customers')
        const customersList: Customer[] = saved ? JSON.parse(saved) : mockCustomers
        const found = customersList.find((c) => onlyNumbers(c.cpf) === queryCpf)

        if (found) {
          if (found.status === 'Inativo') {
            setIdError('Este cadastro está inativo. Entre em contato com o suporte.')
            return
          }
          localStorage.setItem('logged-customer', JSON.stringify(found))
          window.dispatchEvent(new Event('auth-change'))
          alert(`Bem-vindo de volta, ${found.name}!`)
          navigate(fromCheckout ? '/checkout' : '/minha-conta')
        } else {
          setIdError('CPF não encontrado na base de dados. Realize seu cadastro ao lado.')
        }
      } catch (localErr) {
        setIdError('Erro ao buscar cadastro.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  /**
   * FUNÇÃO 2: Cadastrar Novo Cliente no PostgreSQL
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !cpf || !email || !phone) {
      alert('Favor preencher todos os campos obrigatórios (nome, cpf, e-mail, telefone).')
      return
    }

    setIsRegistering(true)

    const customerPayload = {
      name,
      cpf: onlyNumbers(cpf),
      email,
      phone: onlyNumbers(phone),
      status: 'Ativo' as const,
      address,
      city,
      state,
      zipCode: onlyNumbers(zipCode),
      enderecoCobranca: {
        tipoEndereco: 'COBRANCA' as const,
        tipoResidencia,
        tipoLogradouro,
        logradouro: address,
        numero,
        bairro,
        cep: onlyNumbers(zipCode),
        cidade: city,
        estado: state,
        pais,
        observacoes: ''
      },
      enderecoEntrega: {
        tipoEndereco: 'ENTREGA' as const,
        tipoResidencia,
        tipoLogradouro,
        logradouro: address,
        numero,
        bairro,
        cep: onlyNumbers(zipCode),
        cidade: city,
        estado: state,
        pais,
        observacoes: ''
      }
    }

    try {
      // 1. Salva no PostgreSQL via POST /api/clientes
      const newCustomer = await createCustomer(customerPayload)

      // Salva na sessão ativa do navegador
      localStorage.setItem('logged-customer', JSON.stringify(newCustomer))
      window.dispatchEvent(new Event('auth-change'))

      alert('Cadastro realizado com sucesso no banco de dados!')
      navigate(fromCheckout ? '/checkout' : '/minha-conta')
    } catch (err: any) {
      console.warn('⚠️ Tentando fallback local para cadastro...', err)

      // Fallback local
      try {
        const saved = localStorage.getItem('custom-customers')
        const customersList: Customer[] = saved ? JSON.parse(saved) : [...mockCustomers]

        const cleanInputCpf = onlyNumbers(cpf)
        const exists = customersList.some((c) => onlyNumbers(c.cpf) === cleanInputCpf)
        if (exists) {
          alert('Este CPF já está cadastrado. Tente se identificar no painel ao lado.')
          return
        }

        const nextId = String(customersList.length + 1)
        const nextCode = `CLI-${nextId.padStart(4, '0')}`

        const fallbackCustomer: Customer = {
          id: nextId,
          code: nextCode,
          ...customerPayload
        }

        customersList.push(fallbackCustomer)
        localStorage.setItem('custom-customers', JSON.stringify(customersList))
        localStorage.setItem('logged-customer', JSON.stringify(fallbackCustomer))
        window.dispatchEvent(new Event('auth-change'))

        alert('Cadastro realizado com sucesso!')
        navigate(fromCheckout ? '/checkout' : '/minha-conta')
      } catch (localErr) {
        alert(`Falha ao processar o cadastro: ${err.message}`)
      }
    } finally {
      setIsRegistering(false)
    }
  }

   return (
    <div className="flex flex-col gap-6 text-left max-w-6xl mx-auto w-full px-4 py-4">
      {/* Botão Voltar */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Voltar para a Loja
      </Link>

      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Central de Acesso
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Identificação & Cadastro</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {fromCheckout
              ? 'Identifique-se ou crie sua conta para finalizar o pedido com segurança.'
              : 'Acesse seus dados de entrega, cupons de troca e histórico de compras automotivas.'}
          </p>
        </div>

        {fromCheckout && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
            Etapa de Checkout
          </span>
        )}
      </div>

      {/* Grid Principal: 12 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">

        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (5 Colunas): Já sou cliente + Benefícios                 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card 1: Identificação por CPF */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 md:p-7 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Search className="w-4 h-4" />
                </div>
                Já sou cliente
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Digite seu CPF para carregar suas informações e continuar suas compras rapidamente.
              </p>
            </div>

            <form onSubmit={handleIdentify} className="space-y-4">
              <Input
                label="CPF de Identificação"
                value={searchCpf}
                onChange={(e) => setSearchCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
              {idError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                  {idError}
                </div>
              )}
              <Button type="submit" disabled={isSearching} className="w-full justify-center py-3">
                {isSearching ? 'Buscando cadastro...' : 'Localizar Conta'}
              </Button>
            </form>
          </div>

          {/* Card 2: Benefícios da Loja */}
          <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Vantagens de se cadastrar
            </h4>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-xs text-slate-400">
                <Truck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Entrega rápida:</strong> Endereços salvos para fechar compras em 1 clique.</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-slate-400">
                <Ticket className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Cupons e Trocas:</strong> Acesse seus créditos e devoluções pelo painel.</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">Segurança total:</strong> Seus dados protegidos no banco de dados.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA (7 Colunas): Formulário de Nova Conta                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7">
          <form 
            onSubmit={handleRegister} 
            className="bg-slate-900/60 border border-slate-800 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col gap-7"
          >
            {/* Título da Seção */}
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                Criar Nova Conta
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Preencha os campos abaixo para criar seu cadastro completo.
              </p>
            </div>

            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                1. Dados Pessoais
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Nome Completo *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    required
                  />
                </div>

                <Input
                  label="CPF *"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />

                <Input
                  label="Telefone / WhatsApp *"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />

                <div className="md:col-span-2">
                  <Input
                    label="E-mail de Acesso *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SEPARADOR SUTIL */}
            <div className="border-t border-slate-800" />

            {/* SEÇÃO 2: ENDEREÇO DE ENTREGA */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                2. Endereço Principal (Entrega & Cobrança)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="CEP"
                  value={zipCode}
                  onChange={(e) => setZipCode(maskCEP(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                />

                <Select
                  label="Tipo de Residência"
                  value={tipoResidencia}
                  onChange={(e) => setTipoResidencia(e.target.value)}
                  options={tipoResidenciaOptions}
                />

                <Select
                  label="Tipo Logradouro"
                  value={tipoLogradouro}
                  onChange={(e) => setTipoLogradouro(e.target.value)}
                  options={tipoLogradouroOptions}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Logradouro / Rua"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. Paulista, Rua das Flores"
                  />
                </div>

                <Input
                  label="Número"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ex: 123"
                  required
                />

                <Input
                  label="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Ex: Centro"
                  required
                />

                <Input
                  label="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                />

                <Input
                  label="Estado (UF)"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="Ex: SP"
                  maxLength={2}
                />

                <div className="md:col-span-3">
                  <Input
                    label="País"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    placeholder="Brasil"
                  />
                </div>
              </div>
            </div>

            {/* BOTÃO DE SUBMIT */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
              <Button type="submit" disabled={isRegistering} className="w-full justify-center py-3.5 text-sm font-bold shadow-lg shadow-indigo-500/20">
                {isRegistering ? 'Gravando Cadastro...' : 'Finalizar Cadastro e Continuar'}
              </Button>
              <div className="flex items-center gap-2 justify-center text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Seus dados serão gravados com segurança no PostgreSQL.
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  )

}
export default Register
