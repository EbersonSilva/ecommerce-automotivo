import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { mockCustomers } from '../../mock/mockData'
import type { Customer } from '../../mock/mockData'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import { getCustomerById, createCustomer, updateCustomer } from '../../services/customerService'

/**
 * ==============================================================================
 * TELA: FORMULÁRIO DE CLIENTE (Cadastro e Edição no Painel Admin)
 * ==============================================================================
 * Permite cadastrar um novo cliente ou editar um existente diretamente no PostgreSQL.
 */
export const CustomerForm = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  // Campos do Formulário
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')
  
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carrega os dados do cliente se estiver no modo Edição (isEdit = true)
  useEffect(() => {
    if (isEdit && id) {
      const loadCustomerData = async () => {
        try {
          // 1. Tenta buscar da API do PostgreSQL
          const found = await getCustomerById(id)
          setName(found.name)
          setCpf(found.cpf)
          setEmail(found.email)
          setPhone(found.phone)
          setStatus(found.status)
          setAddress(found.address || '')
          setCity(found.city || '')
          setState(found.state || '')
          setZipCode(found.zipCode || '')
        } catch (err) {
          console.warn('⚠️ Não foi possível carregar via API, tentando fallback local...', err)
          const saved = localStorage.getItem('custom-customers')
          const list = saved ? JSON.parse(saved) : mockCustomers
          const found = list.find((c: Customer) => c.id === id)
          if (found) {
            setName(found.name)
            setCpf(found.cpf)
            setEmail(found.email)
            setPhone(found.phone)
            setStatus(found.status)
            setAddress(found.address || '')
            setCity(found.city || '')
            setState(found.state || '')
            setZipCode(found.zipCode || '')
          }
        }
      }
      loadCustomerData()
    }
  }, [id, isEdit])

  /**
   * FUNÇÃO: Salvar Cadastro (Criação ou Edição)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !cpf || !email || !phone) {
      alert('Favor preencher todos os campos obrigatórios (*).')
      return
    }

    setIsSubmitting(true)

    const customerPayload = {
      name,
      cpf,
      email,
      phone,
      status,
      address,
      city,
      state,
      zipCode
    }

    try {
      if (isEdit && id) {
        // Atualiza cliente existente no PostgreSQL (PUT /api/clientes/:id)
        await updateCustomer(id, customerPayload)
        alert('Cadastro do cliente atualizado com sucesso no banco de dados!')
      } else {
        // Cria novo cliente no PostgreSQL (POST /api/clientes)
        await createCustomer(customerPayload)
        alert('Novo cliente cadastrado com sucesso no banco de dados!')
      }

      navigate('/admin/clientes')
    } catch (err: any) {
      console.warn('⚠️ Tentando fallback local devido a erro na API:', err)
      
      // Fallback local se a API estiver indisponível
      try {
        const saved = localStorage.getItem('custom-customers')
        const list: Customer[] = saved ? JSON.parse(saved) : [...mockCustomers]

        if (isEdit) {
          const updated = list.map((c) => (c.id === id ? { ...c, ...customerPayload } : c))
          localStorage.setItem('custom-customers', JSON.stringify(updated))
          alert('Cadastro atualizado localmente!')
        } else {
          const newCustomer: Customer = {
            id: String(list.length + 1),
            code: `CLI-${String(list.length + 1).padStart(4, '0')}`,
            ...customerPayload
          }
          list.push(newCustomer)
          localStorage.setItem('custom-customers', JSON.stringify(list))
          alert('Novo cliente salvo localmente!')
        }
        navigate('/admin/clientes')
      } catch (localErr) {
        alert(`Erro ao gravar registro: ${err.message}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
      <Link 
        to="/admin/clientes" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a Gestão
      </Link>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {isEdit ? 'Editar Cliente' : 'Cadastrar Cliente'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {isEdit ? 'Atualize as informações cadastrais do cliente no PostgreSQL' : 'Adicione um novo cliente à base de dados da autopeças'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-2">
        {/* Seção 1: Informações Pessoais */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
            Informações Cadastrais
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

          <Select
            label="Status Cadastral"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
            options={[
              { value: 'Ativo', label: 'Ativo' },
              { value: 'Inativo', label: 'Inativo' }
            ]}
          />
        </div>

        {/* Seção 2: Endereço de Entrega */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6 justify-between h-full">
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
              Endereço de Entrega
            </h3>

            <Input
              label="Endereço"
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

          <div className="flex justify-end mt-8 border-t border-slate-850 pt-6">
            <Button type="submit" disabled={isSubmitting} className="gap-2 px-8 py-3">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Cadastro'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
export default CustomerForm
