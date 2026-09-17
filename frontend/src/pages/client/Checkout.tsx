import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Check, CreditCard as CardIcon, MapPin, ClipboardCheck, PartyPopper, Ticket, Plus, CheckCircle2 } from 'lucide-react'
import { mockCoupons, mockCards, type Coupon, type CreditCard, type Address } from '../../mock/mockData'
import { getCustomerAddresses, createCustomerAddress } from '../../services/addressService'
import { maskCEP, onlyNumbers } from '../../utils/inputMasks'

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

interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

export const Checkout = () => {
  const [step, setStep] = useState(1) // Steps 1 to 4
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Step 1: Address Selection & State
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string | number>('new')
  const [sameBillingAddress, setSameBillingAddress] = useState(true)
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | number>('new')

  // Novo Endereço de Entrega
  const [newTipoResidencia, setNewTipoResidencia] = useState('CASA')
  const [newTipoLogradouro, setNewTipoLogradouro] = useState('Rua')
  const [newAddress, setNewAddress] = useState('')
  const [newNumero, setNewNumero] = useState('')
  const [newBairro, setNewBairro] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [newZipCode, setNewZipCode] = useState('')
  const [newPais, setNewPais] = useState('Brasil')
  const [saveNewDeliveryAddress, setSaveNewDeliveryAddress] = useState(true)

  // Novo Endereço de Cobrança
  const [newBillingTipoResidencia, setNewBillingTipoResidencia] = useState('CASA')
  const [newBillingTipoLogradouro, setNewBillingTipoLogradouro] = useState('Rua')
  const [newBillingAddress, setNewBillingAddress] = useState('')
  const [newBillingNumero, setNewBillingNumero] = useState('')
  const [newBillingBairro, setNewBillingBairro] = useState('')
  const [newBillingCity, setNewBillingCity] = useState('')
  const [newBillingState, setNewBillingState] = useState('')
  const [newBillingZipCode, setNewBillingZipCode] = useState('')
  const [newBillingPais, setNewBillingPais] = useState('Brasil')
  const [saveNewBillingAddress, setSaveNewBillingAddress] = useState(true)

  // Endereço Selecionado Final para Resumo e Pedido
  const [finalShippingAddressText, setFinalShippingAddressText] = useState('')
  const [finalBillingAddressText, setFinalBillingAddressText] = useState('')

  // Step 2: Coupons State
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([])

  // Step 2: Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Boleto Bancário' | 'Cartão de Crédito' | 'Múltiplos Cartões'>('Pix')

  // Cards Database (Saved cards + Mock cards)
  const [savedCardsList, setSavedCardsList] = useState<CreditCard[]>([])

  // Card 1 state
  const [selectedCardId1, setSelectedCardId1] = useState<string>('new')
  const [cardHolder1, setCardHolder1] = useState('')
  const [cardNumber1, setCardNumber1] = useState('')
  const [cardExpiry1, setCardExpiry1] = useState('')
  const [cardCvv1, setCardCvv1] = useState('')
  const [saveCard1, setSaveCard1] = useState(false)
  const [cardAmount1, setCardAmount1] = useState<number>(0)

  // Card 2 state (for multiple cards)
  const [selectedCardId2, setSelectedCardId2] = useState<string>('new')
  const [cardHolder2, setCardHolder2] = useState('')
  const [cardNumber2, setCardNumber2] = useState('')
  const [cardExpiry2, setCardExpiry2] = useState('')
  const [cardCvv2, setCardCvv2] = useState('')
  const [saveCard2, setSaveCard2] = useState(false)
  const [cardAmount2, setCardAmount2] = useState<number>(0)

  const [createdOrderCode, setCreatedOrderCode] = useState('')

  // Carrega Endereços do PostgreSQL
  const loadAddresses = async (customerId: string) => {
    setLoadingAddresses(true)
    try {
      const data = await getCustomerAddresses(customerId)
      setSavedAddresses(data)
      if (data.length > 0) {
        const deliveryAddr = data.find((a) => a.tipoEndereco === 'ENTREGA') || data[0]
        setSelectedDeliveryAddressId(deliveryAddr.id || 'new')
        const billingAddr = data.find((a) => a.tipoEndereco === 'COBRANCA') || data[0]
        setSelectedBillingAddressId(billingAddr.id || 'new')
      } else {
        setSelectedDeliveryAddressId('new')
        setSelectedBillingAddressId('new')
      }
    } catch (err) {
      console.warn('⚠️ Não foi possível carregar endereços do PostgreSQL:', err)
      setSavedAddresses([])
      setSelectedDeliveryAddressId('new')
    } finally {
      setLoadingAddresses(false)
    }
  }

  // Load Initial Data
  useEffect(() => {
    try {
      // Cart items
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }

      // Logged user address from PostgreSQL
      const savedCustomer = localStorage.getItem('logged-customer')
      let customer: any = null
      if (savedCustomer) {
        customer = JSON.parse(savedCustomer)
        if (customer?.id) {
          loadAddresses(customer.id)
        }
      }

      // Coupons
      const savedCoupons = localStorage.getItem('custom-coupons')
      const customCoupons = savedCoupons ? JSON.parse(savedCoupons) : []
      const allCoupons = [...customCoupons, ...mockCoupons]
      const filteredCoupons = customer
        ? allCoupons.filter((c: Coupon) => c.status === 'Ativo' && c.customerId === customer.id)
        : allCoupons.filter((c: Coupon) => c.status === 'Ativo')
      setAvailableCoupons(filteredCoupons)

      // Cards
      const savedCards = localStorage.getItem('custom-cards')
      const customCards = savedCards ? JSON.parse(savedCards) : []
      setSavedCardsList([...customCards, ...mockCards])
    } catch (err) {
      console.error(err)
    }
  }, [])

  // Totals calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 25.00
  const total = subtotal + shipping

  // Coupons discount calculations
  const couponsDiscount = availableCoupons
    .filter((c) => selectedCouponIds.includes(c.id))
    .reduce((acc, c) => acc + c.value, 0)

  const remainingTotal = Math.max(0, total - couponsDiscount)

  // Initialize Card Amounts when step changes or remainingTotal changes
  useEffect(() => {
    if (paymentMethod === 'Múltiplos Cartões') {
      const half = parseFloat((remainingTotal / 2).toFixed(2))
      setCardAmount1(half)
      setCardAmount2(parseFloat((remainingTotal - half).toFixed(2)))
    } else {
      setCardAmount1(remainingTotal)
      setCardAmount2(0)
    }
  }, [remainingTotal, paymentMethod, step])

  // Handle Card 1 preloaded selection
  useEffect(() => {
    if (selectedCardId1 !== 'new') {
      const card = savedCardsList.find(c => c.id === selectedCardId1)
      if (card) {
        setCardHolder1(card.holder)
        setCardNumber1(card.number)
        setCardExpiry1(card.expiry)
        setCardCvv1(card.cvv)
      }
    } else {
      setCardHolder1('')
      setCardNumber1('')
      setCardExpiry1('')
      setCardCvv1('')
    }
  }, [selectedCardId1, savedCardsList])

  // Handle Card 2 preloaded selection
  useEffect(() => {
    if (selectedCardId2 !== 'new') {
      const card = savedCardsList.find(c => c.id === selectedCardId2)
      if (card) {
        setCardHolder2(card.holder)
        setCardNumber2(card.number)
        setCardExpiry2(card.expiry)
        setCardCvv2(card.cvv)
      }
    } else {
      setCardHolder2('')
      setCardNumber2('')
      setCardExpiry2('')
      setCardCvv2('')
    }
  }, [selectedCardId2, savedCardsList])

  /**
   * FUNÇÃO: Validação e Avanço entre Etapas
   */
  const handleNextStep = async () => {
    // --------------------------------------------------------------------------
    // VALIDAÇÃO DA ETAPA 1 (ENDEREÇOS)
    // --------------------------------------------------------------------------
    if (step === 1) {
      const activeCustomerStr = localStorage.getItem('logged-customer')
      const activeCustomer = activeCustomerStr ? JSON.parse(activeCustomerStr) : null

      let deliverySummary = ''

      // 1. Endereço de Entrega
      if (selectedDeliveryAddressId === 'new') {
        if (!newAddress || !newNumero || !newBairro || !newCity || !newState || !newZipCode) {
          alert('Por favor, preencha todos os campos do endereço de entrega.')
          return
        }

        deliverySummary = `${newTipoLogradouro} ${newAddress}, ${newNumero} - ${newBairro}, ${newCity}/${newState} • CEP: ${maskCEP(newZipCode)}`

        // Se o cliente marcou para salvar o endereço de entrega no PostgreSQL
        if (activeCustomer?.id && saveNewDeliveryAddress) {
          try {
            const created = await createCustomerAddress(activeCustomer.id, {
              tipoEndereco: 'ENTREGA',
              tipoResidencia: newTipoResidencia,
              tipoLogradouro: newTipoLogradouro,
              logradouro: newAddress,
              numero: newNumero,
              bairro: newBairro,
              cidade: newCity,
              estado: newState,
              cep: onlyNumbers(newZipCode),
              pais: newPais,
              observacoes: ''
            })
            setSavedAddresses((prev) => [...prev, created])
          } catch (err: any) {
            console.warn('⚠️ Erro ao salvar endereço de entrega no banco:', err.message)
          }
        }
      } else {
        const found = savedAddresses.find((a) => a.id === selectedDeliveryAddressId)
        if (found) {
          deliverySummary = `${found.tipoLogradouro} ${found.logradouro}, ${found.numero} - ${found.bairro}, ${found.cidade}/${found.estado} • CEP: ${maskCEP(found.cep)}`
        }
      }

      setFinalShippingAddressText(deliverySummary)

      // 2. Endereço de Cobrança
      if (sameBillingAddress) {
        setFinalBillingAddressText(deliverySummary)
      } else {
        let billingSummary = ''
        if (selectedBillingAddressId === 'new') {
          if (!newBillingAddress || !newBillingNumero || !newBillingBairro || !newBillingCity || !newBillingState || !newBillingZipCode) {
            alert('Por favor, preencha todos os campos do endereço de cobrança.')
            return
          }

          billingSummary = `${newBillingTipoLogradouro} ${newBillingAddress}, ${newBillingNumero} - ${newBillingBairro}, ${newBillingCity}/${newBillingState} • CEP: ${maskCEP(newBillingZipCode)}`

          if (activeCustomer?.id && saveNewBillingAddress) {
            try {
              const createdBilling = await createCustomerAddress(activeCustomer.id, {
                tipoEndereco: 'COBRANCA',
                tipoResidencia: newBillingTipoResidencia,
                tipoLogradouro: newBillingTipoLogradouro,
                logradouro: newBillingAddress,
                numero: newBillingNumero,
                bairro: newBillingBairro,
                cidade: newBillingCity,
                estado: newBillingState,
                cep: onlyNumbers(newBillingZipCode),
                pais: newBillingPais,
                observacoes: ''
              })
              setSavedAddresses((prev) => [...prev, createdBilling])
            } catch (err: any) {
              console.warn('⚠️ Erro ao salvar endereço de cobrança no banco:', err.message)
            }
          }
        } else {
          const foundBilling = savedAddresses.find((a) => a.id === selectedBillingAddressId)
          if (foundBilling) {
            billingSummary = `${foundBilling.tipoLogradouro} ${foundBilling.logradouro}, ${foundBilling.numero} - ${foundBilling.bairro}, ${foundBilling.cidade}/${foundBilling.estado} • CEP: ${maskCEP(foundBilling.cep)}`
          }
        }
        setFinalBillingAddressText(billingSummary)
      }
    }

    // --------------------------------------------------------------------------
    // VALIDAÇÃO DA ETAPA 2 (PAGAMENTO)
    // --------------------------------------------------------------------------
    if (step === 2) {
      if (paymentMethod === 'Múltiplos Cartões' && remainingTotal > 0) {
        const sum = parseFloat((cardAmount1 + cardAmount2).toFixed(2))
        const diff = Math.abs(sum - remainingTotal)
        if (diff > 0.02) {
          alert(`A soma dos valores dos cartões (R$ ${sum.toFixed(2)}) deve ser exatamente igual ao valor restante do pedido (R$ ${remainingTotal.toFixed(2)}).`)
          return
        }
      }
      if (paymentMethod === 'Cartão de Crédito' && remainingTotal > 0) {
        if (!cardHolder1 || !cardNumber1 || !cardExpiry1 || !cardCvv1) {
          alert('Por favor, preencha todos os campos do cartão de crédito.')
          return
        }
      }
    }

    setStep((prev) => Math.min(prev + 1, 4))
  }

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleToggleCoupon = (couponId: string) => {
    setSelectedCouponIds((prev) => {
      if (prev.includes(couponId)) {
        return prev.filter((id) => id !== couponId)
      } else {
        return [...prev, couponId]
      }
    })
  }

  /**
   * FUNÇÃO: Finalizar Pedido
   */
  const handlePlaceOrder = () => {
    const newOrderId = `PED-${Math.floor(1000 + Math.random() * 9000)}`
    setCreatedOrderCode(newOrderId)

    try {
      // 1. Marca cupons como Utilizados
      const savedCoupons = localStorage.getItem('custom-coupons')
      const couponsList: Coupon[] = savedCoupons ? JSON.parse(savedCoupons) : []

      const updatedCoupons = couponsList.map((c) => {
        if (selectedCouponIds.includes(c.id)) {
          return { ...c, status: 'Utilizado' as const }
        }
        return c
      })

      mockCoupons.forEach((mc) => {
        if (selectedCouponIds.includes(mc.id)) {
          const alreadyExists = updatedCoupons.find(c => c.id === mc.id)
          if (!alreadyExists) {
            updatedCoupons.push({ ...mc, status: 'Utilizado' as const })
          }
        }
      })
      localStorage.setItem('custom-coupons', JSON.stringify(updatedCoupons))

      // 2. Salva novos cartões se marcado
      const savedCards = localStorage.getItem('custom-cards')
      const cardsList: CreditCard[] = savedCards ? JSON.parse(savedCards) : []

      if (paymentMethod === 'Cartão de Crédito' && selectedCardId1 === 'new' && saveCard1) {
        const brand = cardNumber1.startsWith('4') ? 'Visa' : 'Mastercard'
        cardsList.push({
          id: `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
          holder: cardHolder1,
          number: `**** **** **** ${cardNumber1.slice(-4) || '9999'}`,
          expiry: cardExpiry1,
          cvv: cardCvv1,
          brand
        })
      }

      if (paymentMethod === 'Múltiplos Cartões') {
        if (selectedCardId1 === 'new' && saveCard1) {
          const brand = cardNumber1.startsWith('4') ? 'Visa' : 'Mastercard'
          cardsList.push({
            id: `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
            holder: cardHolder1,
            number: `**** **** **** ${cardNumber1.slice(-4) || '9999'}`,
            expiry: cardExpiry1,
            cvv: cardCvv1,
            brand
          })
        }
        if (selectedCardId2 === 'new' && saveCard2) {
          const brand = cardNumber2.startsWith('4') ? 'Visa' : 'Mastercard'
          cardsList.push({
            id: `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
            holder: cardHolder2,
            number: `**** **** **** ${cardNumber2.slice(-4) || '9999'}`,
            expiry: cardExpiry2,
            cvv: cardCvv2,
            brand
          })
        }
      }
      localStorage.setItem('custom-cards', JSON.stringify(cardsList))

      // 3. Salva novo pedido
      const savedOrders = localStorage.getItem('custom-orders')
      const ordersList = savedOrders ? JSON.parse(savedOrders) : []

      let payMethodDescription = paymentMethod as string
      if (paymentMethod === 'Múltiplos Cartões') {
        payMethodDescription = `Múltiplos Cartões (Cartão 1: R$ ${cardAmount1.toFixed(2)} / Cartão 2: R$ ${cardAmount2.toFixed(2)})`
      }
      if (selectedCouponIds.length > 0) {
        payMethodDescription += ` + ${selectedCouponIds.length} Cupom(ns) (Desconto: R$ ${couponsDiscount.toFixed(2)})`
      }

      const loggedCustomerStr = localStorage.getItem('logged-customer')
      const currentCust = loggedCustomerStr ? JSON.parse(loggedCustomerStr) : null

      const newOrder = {
        id: newOrderId,
        customerId: currentCust ? currentCust.id : 'custom-user',
        customerName: currentCust ? currentCust.name : 'Cliente da Loja',
        date: new Date().toISOString().split('T')[0],
        total: total,
        status: 'EM ABERTO' as const,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod: payMethodDescription,
        shippingAddress: finalShippingAddressText
      }

      ordersList.unshift(newOrder)
      localStorage.setItem('custom-orders', JSON.stringify(ordersList))

      // Limpa o carrinho
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))

      setStep(4)
    } catch (err) {
      console.error(err)
      alert('Falha ao concluir o pedido.')
    }
  }

  // Steps indicators
  const stepsHeader = [
    { num: 1, label: 'Entrega', icon: MapPin },
    { num: 2, label: 'Pagamento', icon: CardIcon },
    { num: 3, label: 'Resumo', icon: ClipboardCheck },
    { num: 4, label: 'Finalizado', icon: PartyPopper }
  ]

  if (cartItems.length === 0 && step < 4) {
    return (
      <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-3xl p-16 max-w-xl mx-auto backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-2">Sem itens para Checkout</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium">Adicione itens no carrinho antes de finalizar a compra.</p>
        <Link to="/produtos">
          <Button variant="primary">Explorar Produtos</Button>
        </Link>
      </div>
    )
  }

  // Guard for customer identification
  const activeCustomerStr = localStorage.getItem('logged-customer')
  const activeCustomer = activeCustomerStr ? JSON.parse(activeCustomerStr) : null

  if (!activeCustomer && step < 4) {
    return (
      <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-3xl p-16 max-w-xl mx-auto backdrop-blur-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl animate-pulse">
          👤
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Identificação Necessária</h2>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Para finalizar sua compra, você precisa estar identificado ou cadastrado no sistema.
          </p>
        </div>
        <Link to="/cadastro" state={{ from: '/checkout' }} className="w-full">
          <Button variant="primary" className="w-full justify-center py-2.5">
            Cadastrar-se ou Identificar por CPF
          </Button>
        </Link>
        <Link to="/carrinho" className="text-xs text-slate-500 hover:text-slate-350 transition-colors">
          Voltar para o Carrinho
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
      <Breadcrumb items={[{ label: 'Carrinho', path: '/carrinho' }, { label: 'Finalizar Compra' }]} />

      <h1 className="text-3xl font-black text-white tracking-tight mb-2">Finalização do Pedido</h1>

      {/* Progress Wizard Header */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {stepsHeader.map((s) => {
          const Icon = s.icon
          const isDone = step > s.num
          const isCurrent = step === s.num
          return (
            <div
              key={s.num}
              className={`flex flex-col md:flex-row items-center gap-2.5 p-3.5 rounded-2xl border transition-all ${isCurrent
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : isDone
                  ? 'bg-slate-900/60 border-slate-800 text-emerald-400'
                  : 'bg-slate-900/20 border-slate-900 text-slate-500'
                }`}
            >
              <div className={`p-2 rounded-xl flex items-center justify-center ${isCurrent
                ? 'bg-indigo-500 text-white'
                : isDone
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-950 text-slate-600'
                }`}>
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider block leading-none">Passo {s.num}</span>
                <span className="text-xs font-bold hidden sm:inline">{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Step Body Panels */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">

          {/* ======================================================================= */}
          {/* STEP 1: Address Details & Selection                                    */}
          {/* ======================================================================= */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-indigo-400" />
                  1. Endereço de Entrega
                </h3>
              </div>

              {/* Lista de Endereços Salvos no PostgreSQL */}
              {loadingAddresses ? (
                <div className="py-6 text-center text-xs text-slate-500">Carregando seus endereços...</div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Selecione onde deseja receber seu pedido:
                  </label>

                  <div className="grid grid-cols-1 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedDeliveryAddressId === addr.id
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedDeliveryAddressId(addr.id!)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                              : 'bg-slate-950/40 border-slate-850 hover:border-slate-700'
                          }`}
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

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selecionado
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-500 hover:text-slate-300">
                                Usar este
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Opção de Cadastrar Novo Endereço de Entrega */}
                    <div
                      onClick={() => setSelectedDeliveryAddressId('new')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedDeliveryAddressId === 'new'
                          ? 'bg-indigo-500/10 border-indigo-500/50'
                          : 'bg-slate-950/20 border-dashed border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Cadastrar Outro Endereço de Entrega</p>
                          <p className="text-[11px] text-slate-500">Preencha um novo endereço para esta entrega</p>
                        </div>
                      </div>

                      {selectedDeliveryAddressId === 'new' && (
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Novo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Formulário de Novo Endereço de Entrega (Se 'new' estiver selecionado) */}
              {selectedDeliveryAddressId === 'new' && (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-indigo-500/30 flex flex-col gap-4 animate-in fade-in duration-200 mt-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Preencher Dados do Novo Endereço de Entrega
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="CEP *"
                      value={newZipCode}
                      onChange={(e) => setNewZipCode(maskCEP(e.target.value))}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                    />
                    <Select
                      label="Tipo Residência *"
                      value={newTipoResidencia}
                      onChange={(e) => setNewTipoResidencia(e.target.value)}
                      options={tipoResidenciaOptions}
                    />
                    <Select
                      label="Tipo Logradouro *"
                      value={newTipoLogradouro}
                      onChange={(e) => setNewTipoLogradouro(e.target.value)}
                      options={tipoLogradouroOptions}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Logradouro / Rua *"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="Ex: Av. Paulista, Rua das Flores"
                        required
                      />
                    </div>
                    <Input
                      label="Número *"
                      value={newNumero}
                      onChange={(e) => setNewNumero(e.target.value)}
                      placeholder="Ex: 123"
                      required
                    />
                    <Input
                      label="Bairro *"
                      value={newBairro}
                      onChange={(e) => setNewBairro(e.target.value)}
                      placeholder="Ex: Centro"
                      required
                    />
                    <Input
                      label="Cidade *"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      required
                    />
                    <Input
                      label="Estado (UF) *"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value.toUpperCase())}
                      placeholder="Ex: SP"
                      maxLength={2}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="País *"
                        value={newPais}
                        onChange={(e) => setNewPais(e.target.value)}
                        placeholder="Brasil"
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-850">
                    <input
                      type="checkbox"
                      checked={saveNewDeliveryAddress}
                      onChange={(e) => setSaveNewDeliveryAddress(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      Salvar este endereço de entrega na minha conta para compras futuras
                    </span>
                  </label>
                </div>
              )}

              {/* Checkbox de Endereço de Cobrança Igual */}
              <label className="flex items-center gap-2.5 cursor-pointer p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors select-none">
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

              {/* SEÇÃO DE COBRANÇA (Se desmarcado) */}
              {!sameBillingAddress && (
                <div className="flex flex-col gap-4 pt-4 border-t border-slate-850 animate-in fade-in duration-200">
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4.5 h-4.5 text-purple-400" />
                    2. Endereço de Cobrança
                  </h3>

                  {/* Seleção entre endereços salvos ou novo de cobrança */}
                  <div className="grid grid-cols-1 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedBillingAddressId === addr.id
                      return (
                        <div
                          key={`billing-${addr.id}`}
                          onClick={() => setSelectedBillingAddressId(addr.id!)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10'
                              : 'bg-slate-950/40 border-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-200">
                              {addr.tipoLogradouro} {addr.logradouro}, {addr.numero}
                            </span>
                            <p className="text-xs text-slate-400">
                              {addr.bairro} - {addr.cidade}/{addr.estado} • CEP: {maskCEP(addr.cep)}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cobrança Selecionada
                            </span>
                          )}
                        </div>
                      )
                    })}

                    <div
                      onClick={() => setSelectedBillingAddressId('new')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedBillingAddressId === 'new'
                          ? 'bg-purple-500/10 border-purple-500/50'
                          : 'bg-slate-950/20 border-dashed border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Cadastrar Outro Endereço de Cobrança</p>
                          <p className="text-[11px] text-slate-500">Preencha um endereço exclusivo para a fatura</p>
                        </div>
                      </div>

                      {selectedBillingAddressId === 'new' && (
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Novo
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedBillingAddressId === 'new' && (
                    <div className="p-5 rounded-2xl bg-slate-950/60 border border-purple-500/30 flex flex-col gap-4 animate-in fade-in duration-200 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          label="CEP de Cobrança *"
                          value={newBillingZipCode}
                          onChange={(e) => setNewBillingZipCode(maskCEP(e.target.value))}
                          placeholder="00000-000"
                          maxLength={9}
                          required
                        />
                        <Select
                          label="Tipo Residência *"
                          value={newBillingTipoResidencia}
                          onChange={(e) => setNewBillingTipoResidencia(e.target.value)}
                          options={tipoResidenciaOptions}
                        />
                        <Select
                          label="Tipo Logradouro *"
                          value={newBillingTipoLogradouro}
                          onChange={(e) => setNewBillingTipoLogradouro(e.target.value)}
                          options={tipoLogradouroOptions}
                        />
                        <div className="md:col-span-2">
                          <Input
                            label="Logradouro / Rua *"
                            value={newBillingAddress}
                            onChange={(e) => setNewBillingAddress(e.target.value)}
                            placeholder="Ex: Av. Paulista, Rua das Flores"
                            required
                          />
                        </div>
                        <Input
                          label="Número *"
                          value={newBillingNumero}
                          onChange={(e) => setNewBillingNumero(e.target.value)}
                          placeholder="Ex: 123"
                          required
                        />
                        <Input
                          label="Bairro *"
                          value={newBillingBairro}
                          onChange={(e) => setNewBillingBairro(e.target.value)}
                          placeholder="Ex: Centro"
                          required
                        />
                        <Input
                          label="Cidade *"
                          value={newBillingCity}
                          onChange={(e) => setNewBillingCity(e.target.value)}
                          placeholder="Ex: São Paulo"
                          required
                        />
                        <Input
                          label="Estado (UF) *"
                          value={newBillingState}
                          onChange={(e) => setNewBillingState(e.target.value.toUpperCase())}
                          placeholder="Ex: SP"
                          maxLength={2}
                          required
                        />
                        <div className="md:col-span-2">
                          <Input
                            label="País *"
                            value={newBillingPais}
                            onChange={(e) => setNewBillingPais(e.target.value)}
                            placeholder="Brasil"
                            required
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-850">
                        <input
                          type="checkbox"
                          checked={saveNewBillingAddress}
                          onChange={(e) => setSaveNewBillingAddress(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500/20 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-300">
                          Salvar este endereço de cobrança na minha conta
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-4">
                <Button onClick={handleNextStep} className="px-8 py-3 font-bold text-sm">
                  Prosseguir para Pagamento
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* STEP 2: Payment & Coupons Details                                      */}
          {/* ======================================================================= */}
          {step === 2 && (
            <div className="flex flex-col gap-6">

              {/* Coupons Section */}
              <div className="border border-slate-900 bg-slate-950/25 p-5 rounded-2xl">
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-indigo-400" />
                  Cupons Disponíveis
                </h4>
                {availableCoupons.length > 0 ? (
                  <div className="space-y-2">
                    {availableCoupons.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${selectedCouponIds.includes(c.id)
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:bg-slate-950 hover:text-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCouponIds.includes(c.id)}
                            onChange={() => handleToggleCoupon(c.id)}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                          />
                          <div>
                            <span className="font-mono font-bold text-indigo-400 block">{c.code}</span>
                            <span className="text-[10px] text-slate-500">{c.description}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          - R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Nenhum cupom ativo disponível para aplicar.</p>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
                Forma de Pagamento
              </h3>
              <Select
                label="Escolha o Método de Pagamento"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                options={[
                  { value: 'Pix', label: 'Pix (Aprovação Instantânea - Desconto 5%)' },
                  { value: 'Boleto Bancário', label: 'Boleto Bancário' },
                  { value: 'Cartão de Crédito', label: 'Um Cartão de Crédito' },
                  { value: 'Múltiplos Cartões', label: 'Múltiplos Cartões de Crédito (Dividir valor)' }
                ]}
              />

              {/* Payment validation messages */}
              {remainingTotal === 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold leading-relaxed">
                  Os cupons aplicados cobrem 100% do saldo do pedido! Nenhum pagamento adicional será necessário.
                </div>
              )}

              {remainingTotal > 0 && (
                <>
                  {/* Option: One Credit Card */}
                  {paymentMethod === 'Cartão de Crédito' && (
                    <div className="flex flex-col gap-4 border-t border-slate-850/50 pt-4 animate-fadeIn">
                      <Select
                        label="Selecionar Cartão de Crédito"
                        value={selectedCardId1}
                        onChange={(e) => setSelectedCardId1(e.target.value)}
                        options={[
                          { value: 'new', label: 'Cadastrar outro Cartão' },
                          ...savedCardsList.map(c => ({ value: c.id, label: `${c.brand} final ${c.number.slice(-4)} (${c.holder})` }))
                        ]}
                      />
                      <Input
                        label="Nome no Titular *"
                        value={cardHolder1}
                        onChange={(e) => setCardHolder1(e.target.value)}
                        placeholder="Nome completo do titular"
                        disabled={selectedCardId1 !== 'new'}
                      />
                      <Input
                        label="Número do Cartão *"
                        value={cardNumber1}
                        onChange={(e) => setCardNumber1(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        disabled={selectedCardId1 !== 'new'}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Vencimento *"
                          value={cardExpiry1}
                          onChange={(e) => setCardExpiry1(e.target.value)}
                          placeholder="MM/AA"
                          disabled={selectedCardId1 !== 'new'}
                        />
                        <Input
                          label="CVV *"
                          value={cardCvv1}
                          onChange={(e) => setCardCvv1(e.target.value)}
                          placeholder="123"
                          disabled={selectedCardId1 !== 'new'}
                        />
                      </div>
                      {selectedCardId1 === 'new' && (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={saveCard1}
                            onChange={(e) => setSaveCard1(e.target.checked)}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                          />
                          <span className="text-[11px] font-bold text-slate-350">Salvar este cartão na minha conta para compras futuras</span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Option: Multiple Credit Cards */}
                  {paymentMethod === 'Múltiplos Cartões' && (
                    <div className="space-y-6 border-t border-slate-850/50 pt-4 animate-fadeIn">

                      {/* CARD 1 BOX */}
                      <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Cartão 1</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            label="Selecionar Cartão"
                            value={selectedCardId1}
                            onChange={(e) => setSelectedCardId1(e.target.value)}
                            options={[
                              { value: 'new', label: 'Cadastrar outro Cartão' },
                              ...savedCardsList.map(c => ({ value: c.id, label: `${c.brand} final ${c.number.slice(-4)} (${c.holder})` }))
                            ]}
                          />
                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[11px] font-bold text-slate-400">Valor a Cobrar no Cartão 1 *</label>
                            <input
                              type="number"
                              value={cardAmount1 || ''}
                              onChange={(e) => setCardAmount1(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all font-mono"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <Input
                          label="Nome Titular Cartão 1 *"
                          value={cardHolder1}
                          onChange={(e) => setCardHolder1(e.target.value)}
                          placeholder="Nome no cartão"
                          disabled={selectedCardId1 !== 'new'}
                        />
                        <Input
                          label="Número do Cartão 1 *"
                          value={cardNumber1}
                          onChange={(e) => setCardNumber1(e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          disabled={selectedCardId1 !== 'new'}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Vencimento *"
                            value={cardExpiry1}
                            onChange={(e) => setCardExpiry1(e.target.value)}
                            placeholder="MM/AA"
                            disabled={selectedCardId1 !== 'new'}
                          />
                          <Input
                            label="CVV *"
                            value={cardCvv1}
                            onChange={(e) => setCardCvv1(e.target.value)}
                            placeholder="123"
                            disabled={selectedCardId1 !== 'new'}
                          />
                        </div>
                        {selectedCardId1 === 'new' && (
                          <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <input
                              type="checkbox"
                              checked={saveCard1}
                              onChange={(e) => setSaveCard1(e.target.checked)}
                              className="rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                            />
                            <span className="text-[11px] font-bold text-slate-350">Salvar este cartão</span>
                          </label>
                        )}
                      </div>

                      {/* CARD 2 BOX */}
                      <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Cartão 2</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            label="Selecionar Cartão"
                            value={selectedCardId2}
                            onChange={(e) => setSelectedCardId2(e.target.value)}
                            options={[
                              { value: 'new', label: 'Cadastrar outro Cartão' },
                              ...savedCardsList.map(c => ({ value: c.id, label: `${c.brand} final ${c.number.slice(-4)} (${c.holder})` }))
                            ]}
                          />
                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[11px] font-bold text-slate-400">Valor a Cobrar no Cartão 2 *</label>
                            <input
                              type="number"
                              value={cardAmount2 || ''}
                              onChange={(e) => setCardAmount2(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all font-mono"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <Input
                          label="Nome Titular Cartão 2 *"
                          value={cardHolder2}
                          onChange={(e) => setCardHolder2(e.target.value)}
                          placeholder="Nome no cartão"
                          disabled={selectedCardId2 !== 'new'}
                        />
                        <Input
                          label="Número do Cartão 2 *"
                          value={cardNumber2}
                          onChange={(e) => setCardNumber2(e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          disabled={selectedCardId2 !== 'new'}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Vencimento *"
                            value={cardExpiry2}
                            onChange={(e) => setCardExpiry2(e.target.value)}
                            placeholder="MM/AA"
                            disabled={selectedCardId2 !== 'new'}
                          />
                          <Input
                            label="CVV *"
                            value={cardCvv2}
                            onChange={(e) => setCardCvv2(e.target.value)}
                            placeholder="123"
                            disabled={selectedCardId2 !== 'new'}
                          />
                        </div>
                        {selectedCardId2 === 'new' && (
                          <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <input
                              type="checkbox"
                              checked={saveCard2}
                              onChange={(e) => setSaveCard2(e.target.checked)}
                              className="rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                            />
                            <span className="text-[11px] font-bold text-slate-350">Salvar este cartão</span>
                          </label>
                        )}
                      </div>

                      {/* Math validation summary box */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
                        <div>
                          <p className="text-slate-400 font-bold">Total Restante a Cobrar:</p>
                          <p className="text-lg font-black text-white font-mono">R$ {remainingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500">Soma Cartões (C1 + C2):</p>
                          <p className={`text-base font-bold font-mono ${Math.abs((cardAmount1 + cardAmount2) - remainingTotal) < 0.02
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                            }`}>
                            R$ {(cardAmount1 + cardAmount2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Option: Pix */}
                  {paymentMethod === 'Pix' && (
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-400 leading-relaxed">
                      O código Copia e Cola / QR Code Pix será gerado na etapa final para conclusão do pagamento.
                    </div>
                  )}

                  {/* Option: Boleto Bancário */}
                  {paymentMethod === 'Boleto Bancário' && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400 leading-relaxed">
                      O boleto bancário será gerado após a confirmação. O prazo de compensação é de até 2 dias úteis.
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between mt-4">
                <Button onClick={handlePrevStep} variant="secondary">
                  Voltar
                </Button>
                <Button onClick={handleNextStep} className="px-8">
                  Revisar Pedido
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* STEP 3: Summary Details                                                */}
          {/* ======================================================================= */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
                Resumo da Compra
              </h3>

              {/* Product recap */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Itens do Pedido</h4>
                <div className="divide-y divide-slate-850 bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="py-2.5 flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">{item.name} <strong className="text-indigo-400">x{item.quantity}</strong></span>
                      <span className="font-mono text-slate-200 font-semibold">
                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Payment recap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl text-xs space-y-2">
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço de Entrega</h4>
                    <p className="text-slate-200 font-medium leading-relaxed">{finalShippingAddressText}</p>
                  </div>
                  {!sameBillingAddress && (
                    <div className="pt-2 border-t border-slate-850">
                      <h4 className="font-bold text-purple-400 uppercase tracking-wider mb-1">Endereço de Cobrança</h4>
                      <p className="text-slate-200 font-medium leading-relaxed">{finalBillingAddressText}</p>
                    </div>
                  )}
                </div>
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Estrutura de Pagamento</h4>
                  <p className="text-slate-300 font-bold mb-1">
                    {paymentMethod === 'Múltiplos Cartões'
                      ? 'Múltiplos Cartões de Crédito'
                      : paymentMethod}
                  </p>
                  <div className="space-y-1 text-slate-400 mt-1.5 font-mono text-[10px]">
                    {selectedCouponIds.length > 0 && (
                      <p className="text-emerald-400">Desconto Cupons: - R$ {couponsDiscount.toFixed(2)}</p>
                    )}
                    {remainingTotal === 0 ? (
                      <p className="text-emerald-450">Cobrado: Saldo totalmente coberto por cupons</p>
                    ) : (
                      <>
                        {paymentMethod === 'Cartão de Crédito' && (
                          <p>Cobrado: R$ {remainingTotal.toFixed(2)} no cartão final {cardNumber1.slice(-4) || '9999'}</p>
                        )}
                        {paymentMethod === 'Múltiplos Cartões' && (
                          <>
                            <p>Cartão 1 ({cardNumber1.slice(-4) || '9999'}): R$ {cardAmount1.toFixed(2)}</p>
                            <p>Cartão 2 ({cardNumber2.slice(-4) || '9999'}): R$ {cardAmount2.toFixed(2)}</p>
                          </>
                        )}
                        {(paymentMethod === 'Pix' || paymentMethod === 'Boleto Bancário') && (
                          <p>Valor a pagar: R$ {remainingTotal.toFixed(2)}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button onClick={handlePrevStep} variant="secondary">
                  Voltar
                </Button>
                <Button onClick={handlePlaceOrder} className="px-8 font-bold">
                  Confirmar e Finalizar
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* STEP 4: Success Finalization                                           */}
          {/* ======================================================================= */}
          {step === 4 && (
            <div className="text-center py-10 flex flex-col items-center gap-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 flex items-center justify-center text-3xl mb-2 animate-bounce">
                🎉
              </div>
              <div>
                <h3 className="text-2xl font-black text-white leading-tight tracking-tight mb-2">
                  Pedido Concluído com Sucesso!
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-1">
                  Seu pedido foi registrado em nosso sistema de simulação.
                </p>
                <span className="text-xs font-mono bg-slate-950 text-indigo-400 px-3.5 py-1.5 rounded-lg border border-slate-850 inline-block mt-3">
                  Código: {createdOrderCode}
                </span>
              </div>

              {/* Splitted billing summary for confirmation screen */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs text-left w-full max-w-md font-mono text-slate-400">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-sans">Comprovante de Lançamento</h4>
                <p>Pedido ID: {createdOrderCode}</p>
                <p>Valor Bruto: R$ {total.toFixed(2)}</p>
                {selectedCouponIds.length > 0 && (
                  <p className="text-emerald-400">Cupons Aplicados: - R$ {couponsDiscount.toFixed(2)}</p>
                )}
                {remainingTotal > 0 ? (
                  <>
                    {paymentMethod === 'Cartão de Crédito' && (
                      <p className="text-indigo-400">Lançado: R$ {remainingTotal.toFixed(2)} no Cartão (Titular: {cardHolder1})</p>
                    )}
                    {paymentMethod === 'Múltiplos Cartões' && (
                      <>
                        <p className="text-indigo-400">Lançado Cartão 1: R$ {cardAmount1.toFixed(2)} (Titular: {cardHolder1})</p>
                        <p className="text-indigo-400">Lançado Cartão 2: R$ {cardAmount2.toFixed(2)} (Titular: {cardHolder2})</p>
                      </>
                    )}
                    {paymentMethod === 'Pix' && <p className="text-indigo-400">Tipo de Pagamento: Pix (R$ {remainingTotal.toFixed(2)})</p>}
                    {paymentMethod === 'Boleto Bancário' && <p className="text-indigo-400">Tipo de Pagamento: Boleto (R$ {remainingTotal.toFixed(2)})</p>}
                  </>
                ) : (
                  <p className="text-emerald-400">Pago integralmente com cupons de troca.</p>
                )}
              </div>

              {paymentMethod === 'Pix' && remainingTotal > 0 && (
                <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-4">
                  <div className="w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center">
                    <div className="w-full h-full border-4 border-slate-950 bg-slate-100 flex items-center justify-center font-bold text-slate-950 text-[10px]">
                      [QR CODE PIX MOCK]
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">Escaneie o código Pix ou copie a chave abaixo:</p>
                  <input
                    type="text"
                    readOnly
                    value="00020126360014br.gov.bcb.pix0114000000000000005204000053039865802BR"
                    className="w-full text-center bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-[10px] text-slate-400 font-mono focus:outline-none"
                  />
                  <Button size="sm" onClick={() => alert('Chave Pix Copiada!')} className="w-full text-xs">
                    Copiar Código Pix
                  </Button>
                </div>
              )}

              {paymentMethod === 'Boleto Bancário' && remainingTotal > 0 && (
                <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl w-full max-w-md flex flex-col gap-3">
                  <p className="text-[10px] text-slate-500">Linha digitável do Boleto:</p>
                  <input
                    type="text"
                    readOnly
                    value="34191.79001 01043.513184 91020.150008 7 99010000053980"
                    className="w-full text-center bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-[10px] text-slate-400 font-mono focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => alert('Linha digitável copiada!')} className="w-full text-xs" variant="secondary">
                      Copiar Linha
                    </Button>
                    <Button size="sm" onClick={() => alert('Visualizando Boleto em PDF')} className="w-full text-xs">
                      Imprimir PDF
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <Link to="/pedidos">
                  <Button variant="primary">Acompanhar Pedido</Button>
                </Link>
                <Link to="/">
                  <Button variant="outline">Voltar para a Home</Button>
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Floating summary sidebar card */}
        {step < 4 && (
          <aside className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-800">
              Resumo Financeiro
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-550 font-bold">Qtd de Peças</span>
                <span className="font-semibold text-slate-350">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} un.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550 font-bold">Valor Bruto</span>
                <span className="font-mono text-slate-300">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550 font-bold">Frete</span>
                <span className="font-mono text-slate-300">
                  {shipping === 0 ? 'Grátis' : `R$ ${shipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              {selectedCouponIds.length > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Desconto de Cupons</span>
                  <span className="font-mono">- R$ {couponsDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-200">Total a Pagar</span>
              <span className="text-lg font-black text-white font-mono">
                R$ {remainingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default Checkout
