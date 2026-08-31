import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { User, MapPin, Save, Ticket, RefreshCcw, Truck } from 'lucide-react'
import { mockCoupons, mockExchanges, mockCustomers, type Coupon, type Exchange, type Customer } from '../../mock/mockData'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'

export const Account = () => {
  const [loggedCustomer, setLoggedCustomer] = useState<Customer | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'coupons' | 'exchanges'>('profile')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')

  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [exchanges, setExchanges] = useState<Exchange[]>([])

  const loadData = (currentCust: Customer | null) => {
    try {
      const savedCoupons = localStorage.getItem('custom-coupons')
      const customCoupons = savedCoupons ? JSON.parse(savedCoupons) : []
      const allCoupons = [...customCoupons, ...mockCoupons]
      const filteredCoupons = currentCust 
        ? allCoupons.filter((c: Coupon) => c.customerId === currentCust.id)
        : allCoupons
      setCoupons(filteredCoupons)

      const savedExchanges = localStorage.getItem('custom-exchanges')
      let customExchanges = savedExchanges ? JSON.parse(savedExchanges) : []
      customExchanges = customExchanges.map((ex: any) => ({
        ...ex,
        status: ex.status === 'Pendente' ? 'TROCA SOLICITADA' : ex.status
      }))
      
      const customExchangeIds = customExchanges.map((ex: Exchange) => ex.id)
      const filteredMocks = mockExchanges.filter((ex) => !customExchangeIds.includes(ex.id))
      const allExchanges = [...customExchanges, ...filteredMocks]
      const filteredExchanges = currentCust
        ? allExchanges.filter((ex: any) => ex.customerId === currentCust.id || ex.customerName === currentCust.name)
        : allExchanges
      setExchanges(filteredExchanges)
    } catch {
      setCoupons(mockCoupons)
      setExchanges(mockExchanges)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('logged-customer')
    let parsed: Customer | null = null
    if (saved) {
      parsed = JSON.parse(saved)
      setLoggedCustomer(parsed)
      setName(parsed?.name || '')
      setEmail(parsed?.email || '')
      setPhone(parsed?.phone || '')
      setCpf(parsed?.cpf || '')
      setAddress(parsed?.address || '')
      setCity(parsed?.city || '')
      setState(parsed?.state || '')
      setZipCode(parsed?.zipCode || '')
    }
    loadData(parsed)
  }, [])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone) {
      alert('Favor preencher todos os campos obrigatórios.')
      return
    }

    try {
      const savedLogged = localStorage.getItem('logged-customer')
      if (!savedLogged) return

      const current = JSON.parse(savedLogged)
      const updatedCustomer: Customer = {
        ...current,
        name,
        email,
        phone
      }

      localStorage.setItem('logged-customer', JSON.stringify(updatedCustomer))

      // Update global customers database
      const saved = localStorage.getItem('custom-customers')
      const customersList: Customer[] = saved ? JSON.parse(saved) : [...mockCustomers]
      const index = customersList.findIndex((c) => c.id === current.id)
      if (index !== -1) {
        customersList[index] = updatedCustomer
      } else {
        customersList.push(updatedCustomer)
      }
      localStorage.setItem('custom-customers', JSON.stringify(customersList))

      // Dispatch auth change event
      window.dispatchEvent(new Event('auth-change'))
      
      alert('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar perfil.')
    }
  }

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const savedLogged = localStorage.getItem('logged-customer')
      if (!savedLogged) return

      const current = JSON.parse(savedLogged)
      const updatedCustomer: Customer = {
        ...current,
        address,
        city,
        state,
        zipCode
      }

      localStorage.setItem('logged-customer', JSON.stringify(updatedCustomer))

      // Update global customers database
      const saved = localStorage.getItem('custom-customers')
      const customersList: Customer[] = saved ? JSON.parse(saved) : [...mockCustomers]
      const index = customersList.findIndex((c) => c.id === current.id)
      if (index !== -1) {
        customersList[index] = updatedCustomer
      } else {
        customersList.push(updatedCustomer)
      }
      localStorage.setItem('custom-customers', JSON.stringify(customersList))

      alert('Endereço de entrega atualizado com sucesso!')
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar endereço.')
    }
  }

  const handleDispatchItem = (exchangeId: string) => {
    const trackingCode = prompt('Digite o código de rastreamento do envio da devolução:')
    if (trackingCode === null) return // canceled
    
    if (!trackingCode.trim()) {
      alert('Favor informar o código de rastreio para despacho.')
      return
    }

    try {
      const savedExchanges = localStorage.getItem('custom-exchanges')
      const customList: Exchange[] = savedExchanges ? JSON.parse(savedExchanges) : []
      
      const foundInCustom = customList.find((ex) => ex.id === exchangeId)
      
      let updatedExchanges: Exchange[]
      if (foundInCustom) {
        const updatedCustom = customList.map((ex) => {
          if (ex.id === exchangeId) {
            return { ...ex, status: 'ITEM ENVIADO' as const }
          }
          return ex
        })
        localStorage.setItem('custom-exchanges', JSON.stringify(updatedCustom))
        const customExchangeIds = updatedCustom.map((ex) => ex.id)
        updatedExchanges = [...updatedCustom, ...mockExchanges.filter(ex => !customExchangeIds.includes(ex.id))]
      } else {
        const mockItem = mockExchanges.find(ex => ex.id === exchangeId)
        if (mockItem) {
          const newItem = { ...mockItem, status: 'ITEM ENVIADO' as const }
          const updatedCustom = [newItem, ...customList]
          localStorage.setItem('custom-exchanges', JSON.stringify(updatedCustom))
          const customExchangeIds = updatedCustom.map((ex) => ex.id)
          updatedExchanges = [...updatedCustom, ...mockExchanges.filter(ex => !customExchangeIds.includes(ex.id))]
        } else {
          updatedExchanges = exchanges
        }
      }

      setExchanges(updatedExchanges)
      alert('Item despachado com sucesso! O status da devolução foi atualizado para "ITEM ENVIADO".')
    } catch (err) {
      console.error(err)
      alert('Falha ao despachar o item.')
    }
  }

  if (!loggedCustomer) {
    return (
      <div className="flex flex-col gap-6 text-left max-w-xl mx-auto w-full py-12">
        <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-sm shadow-2xl text-center flex flex-col gap-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl mx-auto">
            👤
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight mb-2">Identifique-se para acessar sua conta</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Para consultar seus cupons de troca, pedidos e atualizar seus dados de entrega, realize o cadastro ou identifique-se por CPF.
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <Link to="/cadastro" className="w-full">
              <Button className="w-full justify-center py-2.5">
                Identificar ou Cadastrar-se
              </Button>
            </Link>
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-350 transition-colors">
              Voltar para a Home
            </Link>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
      <Breadcrumb items={[{ label: 'Minha Conta' }]} />

      <div className="mb-4">
        <h1 className="text-3xl font-black text-white tracking-tight">Minha Conta</h1>
        <p className="text-xs text-slate-500 font-medium">Gerencie seu perfil, consulte cupons de troca e acompanhe devoluções</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-6 mb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-550 hover:text-slate-200'
          }`}
        >
          Meus Dados
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === 'coupons'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-550 hover:text-slate-200'
          }`}
        >
          Meus Cupons
        </button>
        <button
          onClick={() => setActiveTab('exchanges')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === 'exchanges'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-550 hover:text-slate-200'
          }`}
        >
          Minhas Devoluções / Trocas
        </button>
      </div>

      {/* TAB 1: Profile Details */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2 animate-fadeIn">
          {/* Profile Card Form */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-indigo-400" />
              Dados Pessoais
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="CPF"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  disabled
                />
                <Input
                  label="Telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" className="save-btn gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Perfil
                </Button>
              </div>
            </form>
          </div>

          {/* Address Card Form */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-indigo-400" />
              Endereço de Entrega Padrão
            </h3>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <Input
                label="Endereço"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  label="Estado"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <Input
                label="CEP"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" className="save-btn gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Endereço
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Coupons List */}
      {activeTab === 'coupons' && (
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6 animate-fadeIn mt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
            <Ticket className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider">
              Cupons de Troca e Promocionais
            </h3>
          </div>

          {coupons.length > 0 ? (
            <Table headers={['Código', 'Tipo', 'Valor', 'Status', 'Descrição']}>
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/35 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-400 text-xs">
                    {c.code}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-200">
                    {c.type === 'Troca' ? 'Cupom de Troca' : 'Cupom Promocional'}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-100 text-xs">
                    R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={c.status === 'Ativo' ? 'success' : c.status === 'Utilizado' ? 'neutral' : 'error'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {c.description}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-2xl">
              <span className="text-3xl block mb-2">🎟️</span>
              <p className="text-xs text-slate-500 font-medium">Nenhum cupom disponível em sua conta.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Exchange Requests */}
      {activeTab === 'exchanges' && (
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6 animate-fadeIn mt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
            <RefreshCcw className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider">
              Solicitações de Devolução e Troca
            </h3>
          </div>

          {exchanges.length > 0 ? (
            <Table headers={['Código Troca', 'Código Pedido', 'Produto / Peça', 'Data Solicitação', 'Status', 'Ações']}>
              {exchanges.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-900/35 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-200">
                    {ex.id}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                    {ex.orderId}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-100 max-w-[200px] truncate" title={ex.product}>
                    {ex.product}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-450">
                    {ex.requestDate}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(ex.status)}>
                      {ex.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {ex.status === 'TROCA ACEITA' ? (
                      <Button
                        onClick={() => handleDispatchItem(ex.id)}
                        className="gap-1.5 text-[10px] font-bold py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                        size="sm"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Despachar Item
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Sem Ações</span>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-2xl">
              <span className="text-3xl block mb-2">🔄</span>
              <p className="text-xs text-slate-500 font-medium">Nenhuma solicitação de troca ou devolução registrada.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Account
