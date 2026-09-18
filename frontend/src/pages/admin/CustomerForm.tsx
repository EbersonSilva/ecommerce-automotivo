import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ArrowLeft, Save, UserPlus, MapPin, Plus, CheckCircle2 } from 'lucide-react'
import type { Address } from '../../mock/mockData'
import { getCustomerById, createCustomer, updateCustomer } from '../../services/customerService'
import { getCustomerAddresses, createCustomerAddress } from '../../services/addressService'
import { maskCPF, maskPhone, maskCEP, onlyNumbers } from '../../utils/inputMasks'

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

  // 1. Dados Pessoais / Cadastrais
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')
  // Estado para o Modal de Sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')


  // 2. Endereço de Entrega (Modo Criação)
  const [tipoResidencia, setTipoResidencia] = useState('CASA')
  const [tipoLogradouro, setTipoLogradouro] = useState('Rua')
  const [address, setAddress] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [pais, setPais] = useState('Brasil')

  // 3. Endereço de Cobrança (Modo Criação)
  const [sameBillingAddress, setSameBillingAddress] = useState(true)
  const [billingTipoResidencia, setBillingTipoResidencia] = useState('CASA')
  const [billingTipoLogradouro, setBillingTipoLogradouro] = useState('Rua')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingNumero, setBillingNumero] = useState('')
  const [billingBairro, setBillingBairro] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('')
  const [billingZipCode, setBillingZipCode] = useState('')
  const [billingPais, setBillingPais] = useState('Brasil')

  // 4. Estados do Modo Edição (Listagem e Adição de Endereços)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newTipoEndereco, setNewTipoEndereco] = useState<'ENTREGA' | 'COBRANCA'>('ENTREGA')
  const [newTipoResidencia, setNewTipoResidencia] = useState('CASA')
  const [newTipoLogradouro, setNewTipoLogradouro] = useState('Rua')
  const [newAddress, setNewAddress] = useState('')
  const [newNumero, setNewNumero] = useState('')
  const [newBairro, setNewBairro] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [newZipCode, setNewZipCode] = useState('')
  const [newPais, setNewPais] = useState('Brasil')
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carrega endereços no modo edição
  const loadAddresses = async (customerId: string) => {
    setLoadingAddresses(true)
    try {
      const data = await getCustomerAddresses(customerId)
      setAddresses(data)
    } catch (err) {
      console.warn('⚠️ Não foi possível carregar endereços do cliente:', err)
      setAddresses([])
    } finally {
      setLoadingAddresses(false)
    }
  }

  // Carrega os dados do cliente se estiver no modo Edição (isEdit = true)
  useEffect(() => {
    if (isEdit && id) {
      const loadCustomerData = async () => {
        try {
          const found = await getCustomerById(id)
          setName(found.name)
          setCpf(found.cpf ? maskCPF(found.cpf) : '')
          setEmail(found.email)
          setPhone(found.phone ? maskPhone(found.phone) : '')
          setStatus(found.status)
          await loadAddresses(id)
        } catch (err: any) {
          alert(`Não foi possível carregar o cliente: ${err.message}`)
        }
      }
      loadCustomerData()
    }
  }, [id, isEdit])

  /**
   * FUNÇÃO 1: Salvar Cadastro Principal (Criação ou Edição de Dados Pessoais)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !cpf || !email || !phone) {
      alert('Favor preencher todos os campos obrigatórios (*).')
      return
    }

    if (!isEdit && !sameBillingAddress) {
      if (!billingAddress || !billingNumero || !billingBairro || !billingCity || !billingState || !billingZipCode) {
        alert('Favor preencher todos os campos do endereço de cobrança.')
        return
      }
    }

    setIsSubmitting(true)

    const customerPayload = {
      name,
      cpf: onlyNumbers(cpf),
      email,
      phone: onlyNumbers(phone),
      status
    }

    try {
      if (isEdit && id) {
        // Atualiza dados cadastrais no PostgreSQL (PUT /api/clientes/:id)
        await updateCustomer(id, customerPayload)
        setModalMessage('Dados cadastrais do cliente atualizados com sucesso!')
        setShowSuccessModal(true)
      } else {
        // Monta os payloads de Entrega e Cobrança
        const enderecoEntregaPayload = {
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

        const enderecoCobrancaPayload = sameBillingAddress
          ? {
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
          }
          : {
            tipoEndereco: 'COBRANCA' as const,
            tipoResidencia: billingTipoResidencia,
            tipoLogradouro: billingTipoLogradouro,
            logradouro: billingAddress,
            numero: billingNumero,
            bairro: billingBairro,
            cep: onlyNumbers(billingZipCode),
            cidade: billingCity,
            estado: billingState,
            pais: billingPais,
            observacoes: ''
          }

        // Cria novo cliente no PostgreSQL (POST /api/clientes)
        await createCustomer({
          ...customerPayload,
          enderecoEntrega: enderecoEntregaPayload,
          enderecoCobranca: enderecoCobrancaPayload
        })

        setModalMessage('Novo cliente cadastrado com sucesso no banco de dados!')
        setShowSuccessModal(true)
      }
    } catch (err: any) {
      alert(`Erro ao gravar registro: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * FUNÇÃO 2: Adicionar Novo Endereço no modo Edição
   */
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    if (!newAddress || !newNumero || !newBairro || !newCity || !newState || !newZipCode) {
      alert('Favor preencher todos os campos do novo endereço.')
      return
    }

    setIsSavingAddress(true)
    try {
      const addressPayload: Address = {
        tipoEndereco: newTipoEndereco,
        tipoResidencia: newTipoResidencia,
        tipoLogradouro: newTipoLogradouro,
        logradouro: newAddress,
        numero: newNumero,
        bairro: newBairro,
        cep: onlyNumbers(newZipCode),
        cidade: newCity,
        estado: newState,
        pais: newPais,
        observacoes: ''
      }

      await createCustomerAddress(id, addressPayload)
      alert('Endereço adicionado com sucesso ao cliente!')

      // Limpa formulário e recarrega a lista
      setNewAddress('')
      setNewNumero('')
      setNewBairro('')
      setNewCity('')
      setNewState('')
      setNewZipCode('')
      setShowNewAddressForm(false)
      await loadAddresses(id)
    } catch (err: any) {
      alert(`Erro ao adicionar endereço: ${err.message}`)
    } finally {
      setIsSavingAddress(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto w-full">
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
          {isEdit
            ? 'Atualize as informações cadastrais e gerencie os endereços do cliente no PostgreSQL'
            : 'Adicione um novo cliente com endereços de entrega e cobrança na base de dados'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (5 Colunas): Formulário de Dados Pessoais                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
            Informações Cadastrais
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nome Completo *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome e Sobrenome"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="CPF *"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                disabled={isEdit}
              />
              <Input
                label="Telefone *"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
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

            <div className="flex justify-end mt-4 pt-4 border-t border-slate-850">
              <Button type="submit" disabled={isSubmitting} className="gap-2 w-full justify-center py-3">
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar Dados Cadastrais' : 'Salvar Cadastro Completo'}
              </Button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA (7 Colunas): Endereços (Criação ou Edição)               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* CASO 1: MODO EDIÇÃO -> Lista e adiciona múltiplos endereços */}
          {isEdit ? (
            <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-indigo-400" />
                  Endereços Registrados
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showNewAddressForm ? 'Fechar' : 'Novo Endereço'}
                </Button>
              </div>

              {/* Formulário Colapsável de Novo Endereço */}
              {showNewAddressForm && (
                <form onSubmit={handleAddNewAddress} className="p-5 rounded-2xl bg-slate-950/60 border border-indigo-500/30 flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Endereço ao Cliente
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select
                      label="Finalidade"
                      value={newTipoEndereco}
                      onChange={(e) => setNewTipoEndereco(e.target.value as 'ENTREGA' | 'COBRANCA')}
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
                      label="Tipo Residência"
                      value={newTipoResidencia}
                      onChange={(e) => setNewTipoResidencia(e.target.value)}
                      options={tipoResidenciaOptions}
                    />
                    <Select
                      label="Tipo Logradouro"
                      value={newTipoLogradouro}
                      onChange={(e) => setNewTipoLogradouro(e.target.value)}
                      options={tipoLogradouroOptions}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Logradouro"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="Ex: Av. Paulista"
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
                      onClick={() => setShowNewAddressForm(false)}
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

              {/* Lista de Endereços Cadastrados */}
              {loadingAddresses ? (
                <div className="py-8 text-center text-xs text-slate-500">Carregando endereços do cliente...</div>
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
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${addr.tipoEndereco === 'ENTREGA'
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
          ) : (
            /* CASO 2: MODO CRIAÇÃO -> Formulário de Entrega + Cobrança */
            <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
              {/* Seção Endereço de Entrega */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-indigo-400" />
                  Endereço de Entrega
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="CEP *"
                    value={zipCode}
                    onChange={(e) => setZipCode(maskCEP(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                  <Select
                    label="Tipo de Residência *"
                    value={tipoResidencia}
                    onChange={(e) => setTipoResidencia(e.target.value)}
                    options={tipoResidenciaOptions}
                  />
                  <Select
                    label="Tipo Logradouro *"
                    value={tipoLogradouro}
                    onChange={(e) => setTipoLogradouro(e.target.value)}
                    options={tipoLogradouroOptions}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Logradouro *"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Av. Paulista, Rua das Flores"
                      required
                    />
                  </div>
                  <Input
                    label="Número *"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 123"
                    required
                  />
                  <Input
                    label="Bairro *"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Centro"
                    required
                  />
                  <Input
                    label="Cidade *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    required
                  />
                  <Input
                    label="Estado (UF) *"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="Ex: SP"
                    maxLength={2}
                    required
                  />
                  <div className="md:col-span-3">
                    <Input
                      label="País *"
                      value={pais}
                      onChange={(e) => setPais(e.target.value)}
                      placeholder="Brasil"
                      required
                    />
                  </div>
                </div>

                {/* Checkbox de Endereço de Cobrança Igual */}
                <label className="flex items-center gap-2.5 cursor-pointer mt-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={sameBillingAddress}
                    onChange={(e) => setSameBillingAddress(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    O endereço de cobrança é o mesmo de entrega
                  </span>
                </label>
              </div>

              {/* Seção Endereço de Cobrança (Se desmarcado) */}
              {!sameBillingAddress && (
                <div className="flex flex-col gap-4 pt-4 border-t border-slate-850 animate-in fade-in duration-200">
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4.5 h-4.5 text-purple-400" />
                    Endereço de Cobrança
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="CEP de Cobrança *"
                      value={billingZipCode}
                      onChange={(e) => setBillingZipCode(maskCEP(e.target.value))}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                    />
                    <Select
                      label="Tipo de Residência *"
                      value={billingTipoResidencia}
                      onChange={(e) => setBillingTipoResidencia(e.target.value)}
                      options={tipoResidenciaOptions}
                    />
                    <Select
                      label="Tipo Logradouro *"
                      value={billingTipoLogradouro}
                      onChange={(e) => setBillingTipoLogradouro(e.target.value)}
                      options={tipoLogradouroOptions}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Logradouro *"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        placeholder="Ex: Av. Paulista, Rua das Flores"
                        required
                      />
                    </div>
                    <Input
                      label="Número *"
                      value={billingNumero}
                      onChange={(e) => setBillingNumero(e.target.value)}
                      placeholder="Ex: 123"
                      required
                    />
                    <Input
                      label="Bairro *"
                      value={billingBairro}
                      onChange={(e) => setBillingBairro(e.target.value)}
                      placeholder="Ex: Centro"
                      required
                    />
                    <Input
                      label="Cidade *"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      required
                    />
                    <Input
                      label="Estado (UF) *"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value.toUpperCase())}
                      placeholder="Ex: SP"
                      maxLength={2}
                      required
                    />
                    <div className="md:col-span-3">
                      <Input
                        label="País *"
                        value={billingPais}
                        onChange={(e) => setBillingPais(e.target.value)}
                        placeholder="Brasil"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* MODAL DE SUCESSO */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          navigate('/admin/clientes')
        }}
        title="Sucesso!"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false)
              navigate('/admin/clientes')
            }}
          >
            OK, Continuar
          </Button>
        }
      >
        <div className="flex items-center gap-4 py-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 flex-shrink-0" />
          <p className="text-slate-200 text-base">{modalMessage}</p>
        </div>
      </Modal>
    </div>
  )
}
export default CustomerForm
