import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { User, MapPin, Save, Ticket, RefreshCcw, Truck, Plus, CheckCircle2, Package, Eye, Calendar } from 'lucide-react'
import { mockCoupons, mockExchanges, mockCustomers, mockOrders, type Coupon, type Exchange, type Customer, type Address, type Order } from '../../mock/mockData'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { updateCustomer } from '../../services/customerService'
import { getCustomerAddresses, createCustomerAddress } from '../../services/addressService'
import { maskPhone, maskCEP, onlyNumbers } from '../../utils/inputMasks'

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

const tipoEnderecoOptions = [
  { value: 'ENTREGA', label: 'Entrega' },
  { value: 'COBRANCA', label: 'Cobrança' },
]

export const Account = () => {
  const [loggedCustomer, setLoggedCustomer] = useState<Customer | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'coupons' | 'exchanges'>('profile')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')

  // Formulário de Novo Endereço
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showNewAddressModal, setShowNewAddressModal] = useState(false)
  const [tipoEndereco, setTipoEndereco] = useState<'ENTREGA' | 'COBRANCA'>('ENTREGA')
  const [tipoResidencia, setTipoResidencia] = useState('Casa')
  const [tipoLogradouro, setTipoLogradouro] = useState('Rua')
  const [newAddress, setNewAddress] = useState('')
  const [newNumero, setNewNumero] = useState('')
  const [newBairro, setNewBairro] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [newZipCode, setNewZipCode] = useState('')
  const [newPais, setNewPais] = useState('Brasil')
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  // Pedidos, Cupons e Trocas
  const [orders, setOrders] = useState<Order[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [exchanges, setExchanges] = useState<Exchange[]>([])

  const loadData = (currentCust: Customer | null) => {
    try {
      // 1. Pedidos do Cliente
      const savedOrders = localStorage.getItem('custom-orders')
      const customOrders = savedOrders ? JSON.parse(savedOrders) : []
      const allOrders = [...customOrders, ...mockOrders]
      const filteredOrders = currentCust
        ? allOrders.filter((o: Order) => o.customerId === currentCust.id || o.customerName === currentCust.name)
        : allOrders
      setOrders(filteredOrders)

      // 2. Cupons do Cliente
      const savedCoupons = localStorage.getItem('custom-coupons')
      const customCoupons = savedCoupons ? JSON.parse(savedCoupons) : []
      const allCoupons = [...customCoupons, ...mockCoupons]
      const filteredCoupons = currentCust
        ? allCoupons.filter((c: Coupon) => c.customerId === currentCust.id)
        : allCoupons
      setCoupons(filteredCoupons)

      // 3. Trocas e Devoluções do Cliente
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
      setOrders(mockOrders)
      setCoupons(mockCoupons)
      setExchanges(mockExchanges)
    }
  }

  const loadAddresses = async (customerId: string) => {
    setLoadingAddresses(true)
    try {
      const data = await getCustomerAddresses(customerId)
      setAddresses(data)
    } catch (err) {
      console.warn('⚠️ Não foi possível carregar endereços do PostgreSQL:', err)
    } finally {
      setLoadingAddresses(false)
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
      if (parsed?.id) {
        loadAddresses(parsed.id)
      }
    }
    loadData(parsed)
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
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

      try {
        await updateCustomer(current.id, { name, email, phone })
      } catch (apiErr) {
        console.warn('⚠️ Não foi possível salvar no PostgreSQL, salvando localmente...', apiErr)
      }

      localStorage.setItem('logged-customer', JSON.stringify(updatedCustomer))

      const saved = localStorage.getItem('custom-customers')
      const customersList: Customer[] = saved ? JSON.parse(saved) : [...mockCustomers]
      const index = customersList.findIndex((c) => c.id === current.id)
      if (index !== -1) {
        customersList[index] = updatedCustomer
      } else {
        customersList.push(updatedCustomer)
      }
      localStorage.setItem('custom-customers', JSON.stringify(customersList))

      window.dispatchEvent(new Event('auth-change'))
      alert('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar perfil.')
    }
  }

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loggedCustomer?.id) return

    if (!newAddress || !newNumero || !newBairro || !newCity || !newState || !newZipCode) {
      alert('Favor preencher todos os campos do endereço.')
      return
    }

    setIsSavingAddress(true)
    try {
      const addressPayload: Address = {
        tipoEndereco,
        tipoResidencia,
        tipoLogradouro,
        logradouro: newAddress,
        numero: newNumero,
        bairro: newBairro,
        cep: onlyNumbers(newZipCode),
        cidade: newCity,
        estado: newState,
        pais: newPais,
        observacoes: ''
      }

      await createCustomerAddress(loggedCustomer.id, addressPayload)
      alert('Endereço adicionado com sucesso!')

      setNewAddress('')
      setNewNumero('')
      setNewBairro('')
      setNewCity('')
      setNewState('')
      setNewZipCode('')
      setShowNewAddressModal(false)
      loadAddresses(loggedCustomer.id)
    } catch (err: any) {
      alert(`Erro ao adicionar endereço: ${err.message}`)
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handleDispatchItem = (exchangeId: string) => {
    const trackingCode = prompt('Digite o código de rastreamento do envio da devolução:')
    if (trackingCode === null) return

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
              Para consultar seus pedidos, cupons de troca e gerenciar seus dados de entrega, realize o cadastro ou identifique-se por CPF.
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
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto w-full">
      <Breadcrumb items={[{ label: 'Minha Conta' }]} />

      <div className="mb-2">
        <h1 className="text-3xl font-black text-white tracking-tight">Minha Conta</h1>
        <p className="text-xs text-slate-500 font-medium">Gerencie seu perfil, acompanhe seus pedidos, cupons e devoluções</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-6 mb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-550 hover:text-slate-200'
          }`}
        >
          Meus Dados
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-550 hover:text-slate-200'
          }`}
        >
          Meus Pedidos
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'coupons'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-550 hover:text-slate-200'
          }`}
        >
          Meus Cupons
        </button>
        <button
          onClick={() => setActiveTab('exchanges')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'exchanges'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-550 hover:text-slate-200'
          }`}
        >
          Minhas Devoluções / Trocas
        </button>
      </div>

      {/* TAB 1: Profile Details & Endereços */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2 animate-fadeIn">
          {/* Coluna Esquerda (5 cols): Dados Pessoais */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-indigo-400" />
              Dados Pessoais
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="CPF"
                  value={cpf}
                  disabled
                />
                <Input
                  label="Telefone"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  maxLength={15}
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Perfil
                </Button>
              </div>
            </form>
          </div>

          {/* Coluna Direita (7 cols): Lista de Endereços */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4.5 h-4.5 text-indigo-400" />
                Meus Endereços
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowNewAddressModal(!showNewAddressModal)}
                className="gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                {showNewAddressModal ? 'Fechar Formulário' : 'Novo Endereço'}
              </Button>
            </div>

            {/* Formulário de Novo Endereço (Colapsável) */}
            {showNewAddressModal && (
              <form onSubmit={handleAddNewAddress} className="p-5 rounded-2xl bg-slate-950/60 border border-indigo-500/30 flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar Novo Endereço
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="Finalidade"
                    value={tipoEndereco}
                    onChange={(e) => setTipoEndereco(e.target.value as 'ENTREGA' | 'COBRANCA')}
                    options={tipoEnderecoOptions}
                  />

                  <Input
                    label="CEP"
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(maskCEP(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                    required
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
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Ex: Av. Paulista, Rua das Flores"
                      required
                    />
                  </div>

                  <Input
                    label="Número"
                    value={newNumero}
                    onChange={(e) => setNewNumero(e.target.value)}
                    placeholder="Ex: 123"
                    required
                  />

                  <Input
                    label="Bairro"
                    value={newBairro}
                    onChange={(e) => setNewBairro(e.target.value)}
                    placeholder="Ex: Centro"
                    required
                  />

                  <Input
                    label="Cidade"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    required
                  />

                  <Input
                    label="Estado (UF)"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value.toUpperCase())}
                    placeholder="Ex: SP"
                    maxLength={2}
                    required
                  />

                  <div className="md:col-span-2">
                    <Input
                      label="País"
                      value={newPais}
                      onChange={(e) => setNewPais(e.target.value)}
                      placeholder="Brasil"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewAddressModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingAddress}
                    className="gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingAddress ? 'Salvando...' : 'Gravar Endereço'}
                  </Button>
                </div>
              </form>
            )}

            {/* Listagem de Endereços */}
            {loadingAddresses ? (
              <div className="py-8 text-center text-xs text-slate-500">Carregando endereços...</div>
            ) : addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            addr.tipoEndereco === 'ENTREGA'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}
                        >
                          {addr.tipoEndereco}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {addr.tipoLogradouro} {addr.logradouro}, {addr.numero}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {addr.bairro} - {addr.cidade}/{addr.estado} • CEP: {maskCEP(addr.cep)}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {addr.tipoResidencia} • {addr.pais}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Ativo
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-950/20 border border-slate-850 rounded-2xl">
                <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Nenhum endereço cadastrado no PostgreSQL.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Orders List (NOVA ABA DE MEUS PEDIDOS) */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6 animate-fadeIn mt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
            <Package className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider">
              Histórico de Pedidos
            </h3>
          </div>

          {orders.length > 0 ? (
            <Table headers={['Código', 'Data', 'Itens do Pedido', 'Total', 'Status', 'Ações']}>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-900/35 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-400 text-xs">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {order.date}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300 max-w-[260px] truncate" title={order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}>
                    {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-100 text-xs">
                    R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/pedidos/${order.id}`}>
                      <Button variant="secondary" size="sm" className="flex items-center gap-1.5 py-1 px-2.5 text-xs">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        Detalhes
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="text-center py-12 bg-slate-950/20 border border-slate-850 rounded-2xl">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-300 mb-1">Nenhum pedido realizado ainda</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Explore nosso catálogo automotivo e faça seu primeiro pedido!
              </p>
              <Link to="/produtos">
                <Button size="sm" className="px-6">
                  Ver Catálogo de Peças
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Coupons List */}
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

      {/* TAB 4: Exchange Requests */}
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
