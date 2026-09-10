import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { mockCustomers } from '../../mock/mockData'
import type { Customer } from '../../mock/mockData'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, UserPlus, Search, ShieldCheck } from 'lucide-react'
import { getCustomerByCpf, createCustomer } from '../../services/customerService'
import { maskCPF } from '../../utils/inputMasks' // Importa a função de máscara de CPF

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
  const [isRegistering, setIsRegistering] = useState(false)

  // Remove caracteres não numéricos do CPF
  const cleanCpf = (val: string) => val.replace(/\D/g, '')

  /**
   * FUNÇÃO 1: Identificar Cliente por CPF no PostgreSQL
   */
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIdError('')

    const queryCpf = cleanCpf(searchCpf)
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
        const found = customersList.find((c) => cleanCpf(c.cpf) === queryCpf)

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
      cpf: cleanCpf(cpf),
      email,
      phone,
      status: 'Ativo' as const,
      address,
      city,
      state,
      zipCode
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

        const cleanInputCpf = cleanCpf(cpf)
        const exists = customersList.some((c) => cleanCpf(c.cpf) === cleanInputCpf)
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
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto w-full">
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a Loja
      </Link>

      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Cadastro / Identificação</h1>
        <p className="text-xs text-slate-500 font-medium">
          {fromCheckout 
            ? 'Identifique-se ou crie sua conta para finalizar a compra de seus itens automotivos.' 
            : 'Acesse seus dados de entrega, cupons de troca e histórico de compras.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-2">
        
        {/* Painel 1: Identificação Rápida por CPF */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
              <Search className="w-4.5 h-4.5 text-indigo-400" />
              Já sou cliente
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Caso já tenha realizado compras conosco, digite seu CPF cadastrado no sistema.
            </p>
          </div>

          <form onSubmit={handleIdentify} className="space-y-4">
            <Input
              label="CPF de Identificação"
              value={searchCpf}
              onChange={(e) => setSearchCpf(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              required
            />
            {idError && <p className="text-[10px] text-rose-400 font-semibold">{idError}</p>}
            <Button type="submit" disabled={isSearching} className="w-full justify-center">
              {isSearching ? 'Buscando...' : 'Buscar Cadastro'}
            </Button>
          </form>
        </div>

        {/* Painel 2: Formulário de Nova Conta */}
        <form onSubmit={handleRegister} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
              Nova Conta
            </h3>

            <Input
              label="Nome Completo *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome e Sobrenome"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CPF *"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                required
              />
              <Input
                label="Telefone *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <Input
              label="E-mail *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
              required
            />
          </div>

          {/* Dados de Entrega */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-5 justify-between">
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
                Endereço de Entrega
              </h3>

              <Input
                label="Endereço Completo"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento e bairro"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                />
                <Input
                  label="Estado"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Ex: SP"
                />
              </div>

              <Input
                label="CEP"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="00000-000"
              />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-slate-850">
              <Button type="submit" disabled={isRegistering} className="w-full justify-center py-3">
                {isRegistering ? 'Cadastrando...' : 'Finalizar e Acessar'}
              </Button>
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Dados seguros gravados no PostgreSQL.
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}
export default Register
