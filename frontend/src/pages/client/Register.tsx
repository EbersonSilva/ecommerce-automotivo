import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { mockCustomers } from '../../mock/mockData'
import type { Customer } from '../../mock/mockData'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, UserPlus, Search, ShieldCheck } from 'lucide-react'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if user came from checkout redirect
  const fromCheckout = location.state?.from === '/checkout'

  // Identification State (CPF search)
  const [searchCpf, setSearchCpf] = useState('')
  const [idError, setIdError] = useState('')

  // Form State (New customer)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')

  // Clean CPF string for comparison (keeps only numbers)
  const cleanCpf = (val: string) => val.replace(/\D/g, '')

  // Handle identification search
  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault()
    setIdError('')

    const queryCpf = cleanCpf(searchCpf)
    if (!queryCpf) {
      setIdError('Por favor, informe seu CPF.')
      return
    }

    try {
      const saved = localStorage.getItem('custom-customers')
      const customersList: Customer[] = saved ? JSON.parse(saved) : mockCustomers
      
      const found = customersList.find((c) => cleanCpf(c.cpf) === queryCpf)

      if (found) {
        if (found.status === 'Inativo') {
          setIdError('Este cadastro está inativo. Entre em contato com o suporte.')
          return
        }

        // Save active session
        localStorage.setItem('logged-customer', JSON.stringify(found))
        
        // Dispatch event for other components (e.g. Header)
        window.dispatchEvent(new Event('auth-change'))
        
        alert(`Bem-vindo de volta, ${found.name}!`)
        if (fromCheckout) {
          navigate('/checkout')
        } else {
          navigate('/minha-conta')
        }
      } else {
        setIdError('CPF não encontrado na base de dados. Por favor, realize seu cadastro ao lado.')
      }
    } catch (err) {
      console.error(err)
      setIdError('Erro ao buscar cadastro.')
    }
  }

  // Handle new customer registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !cpf || !email || !phone) {
      alert('Favor preencher todos os campos obrigatórios (nome, cpf, e-mail, telefone).')
      return
    }

    const cleanInputCpf = cleanCpf(cpf)

    try {
      const saved = localStorage.getItem('custom-customers')
      const customersList: Customer[] = saved ? JSON.parse(saved) : [...mockCustomers]

      // Check if CPF already exists
      const exists = customersList.some((c) => cleanCpf(c.cpf) === cleanInputCpf)
      if (exists) {
        alert('Este CPF já está cadastrado. Tente se identificar no painel de busca.')
        return
      }

      // Generate a new code
      const nextId = String(customersList.length + 1)
      const nextCode = `CLI-${nextId.padStart(4, '0')}`

      const newCustomer: Customer = {
        id: nextId,
        code: nextCode,
        name,
        cpf,
        email,
        phone,
        status: 'Ativo',
        address,
        city,
        state,
        zipCode
      }

      // Add to database
      customersList.push(newCustomer)
      localStorage.setItem('custom-customers', JSON.stringify(customersList))

      // Auto login
      localStorage.setItem('logged-customer', JSON.stringify(newCustomer))
      window.dispatchEvent(new Event('auth-change'))

      alert('Cadastro realizado com sucesso!')
      if (fromCheckout) {
        navigate('/checkout')
      } else {
        navigate('/minha-conta')
      }
    } catch (err) {
      console.error(err)
      alert('Falha ao processar o cadastro.')
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
        
        {/* Box 1: Simple CPF identification */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
              <Search className="w-4.5 h-4.5 text-indigo-400" />
              Já sou cliente
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Caso já tenha realizado compras conosco ou seu cadastro tenha sido feito anteriormente, insira o seu CPF para reativar seu acesso.
            </p>
          </div>

          <form onSubmit={handleIdentify} className="space-y-4">
            <Input
              label="CPF de Identificação"
              value={searchCpf}
              onChange={(e) => setSearchCpf(e.target.value)}
              placeholder="000.000.000-00"
              required
            />
            {idError && <p className="text-[10px] text-rose-400 font-semibold">{idError}</p>}
            <Button type="submit" className="w-full justify-center">
              Buscar Cadastro
            </Button>
          </form>
        </div>

        {/* Box 2: Full sign up form */}
        <form onSubmit={handleRegister} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section: Personal Info */}
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
                onChange={(e) => setCpf(e.target.value)}
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

          {/* Section: Delivery Details */}
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
              <Button type="submit" className="w-full justify-center py-3">
                Finalizar e Acessar
              </Button>
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Dados seguros e criptografados localmente.
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}

export default Register
