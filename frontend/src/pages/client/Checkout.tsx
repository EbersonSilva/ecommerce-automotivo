import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Check, CreditCard, MapPin, ClipboardCheck, PartyPopper } from 'lucide-react'

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

  // Form Fields State
  const [address, setAddress] = useState('Av. Paulista, 1000 - Ap 42')
  const [city, setCity] = useState('São Paulo')
  const [state, setState] = useState('SP')
  const [zipCode, setZipCode] = useState('01310-100')
  
  const [paymentMethod, setPaymentMethod] = useState('Pix')
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const [createdOrderCode, setCreatedOrderCode] = useState('')

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 25.00
  const total = subtotal + shipping

  const handleNextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handlePlaceOrder = () => {
    // Generate a mock order ID
    const newOrderId = `PED-${Math.floor(1000 + Math.random() * 9000)}`
    setCreatedOrderCode(newOrderId)

    // Save mock order in localStorage so it appears in the Orders page
    try {
      const savedOrders = localStorage.getItem('custom-orders')
      const ordersList = savedOrders ? JSON.parse(savedOrders) : []
      
      const newOrder = {
        id: newOrderId,
        customerId: 'custom-user',
        customerName: 'Cliente Acadêmico (Você)',
        date: new Date().toISOString().split('T')[0],
        total: total,
        status: 'EM ABERTO', // Inicia em Aberto conforme máquina de estados
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod: paymentMethod,
        shippingAddress: `${address}, ${city} - ${state}, ${zipCode}`
      }
      
      ordersList.unshift(newOrder) // Prepend new order
      localStorage.setItem('custom-orders', JSON.stringify(ordersList))
      
      // Empty the cart
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))
      
      // Navigate to Finalization step
      setStep(4)
    } catch (err) {
      console.error(err)
      alert('Falha ao concluir o pedido.')
    }
  }

  // Steps indicators
  const stepsHeader = [
    { num: 1, label: 'Entrega', icon: MapPin },
    { num: 2, label: 'Pagamento', icon: CreditCard },
    { num: 3, label: 'Resumo', icon: ClipboardCheck },
    { num: 4, label: 'Finalizado', icon: PartyPopper }
  ]

  if (cartItems.length === 0 && step < 4) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Sem itens para Checkout</h2>
        <p className="text-sm text-slate-500 mb-6 font-medium">Adicione itens no carrinho antes de finalizar a compra.</p>
        <Link to="/produtos">
          <Button variant="primary">Explorar Produtos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
      <Breadcrumb items={[{ label: 'Carrinho', path: '/carrinho' }, { label: 'Finalizar Compra' }]} />

      <h1 className="text-3xl font-black text-white tracking-tight mb-2">Finalização do Pedido</h1>

      {/* Progress Wizard Header */}
      <div className="grid grid-cols-4 gap-2 mb-10">
        {stepsHeader.map((s) => {
          const Icon = s.icon
          const isDone = step > s.num
          const isCurrent = step === s.num
          return (
            <div 
              key={s.num} 
              className={`flex flex-col md:flex-row items-center gap-2.5 p-3.5 rounded-2xl border transition-all ${
                isCurrent 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : isDone
                    ? 'bg-slate-900/60 border-slate-800 text-emerald-400'
                    : 'bg-slate-900/20 border-slate-900 text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-xl flex items-center justify-center ${
                isCurrent 
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
          
          {/* STEP 1: Address Details */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
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
                  placeholder="Ex: São Paulo"
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
              <div className="flex justify-end mt-4">
                <Button onClick={handleNextStep} className="px-8">
                  Prosseguir para Pagamento
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Details */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
                Método de Pagamento
              </h3>
              <Select
                label="Escolha a Forma de Pagamento"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'Pix', label: 'Pix (Aprovação Instantânea - Desconto 5%)' },
                  { value: 'Cartão de Crédito', label: 'Cartão de Crédito (Até 12x)' },
                  { value: 'Boleto Bancário', label: 'Boleto Bancário' }
                ]}
              />

              {paymentMethod === 'Cartão de Crédito' && (
                <div className="flex flex-col gap-4 border-t border-slate-850/50 pt-4 animate-fadeIn">
                  <Input
                    label="Nome no Cartão"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Nome completo do titular"
                  />
                  <Input
                    label="Número do Cartão"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Vencimento"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                    />
                    <Input
                      label="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'Pix' && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-400 leading-relaxed">
                  O código Copia e Cola / QR Code Pix será gerado na etapa final para conclusão do pagamento.
                </div>
              )}

              {paymentMethod === 'Boleto Bancário' && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400 leading-relaxed">
                  O boleto bancário será gerado após a confirmação. O prazo de compensação é de até 2 dias úteis.
                </div>
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

          {/* STEP 3: Summary Details */}
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

              {/* Delivery info recap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Endereço de Entrega</h4>
                  <p className="text-slate-300">{address}</p>
                  <p className="text-slate-350">{city} - {state}, {zipCode}</p>
                </div>
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Forma de Pagamento</h4>
                  <p className="text-slate-300 font-medium">{paymentMethod}</p>
                  {paymentMethod === 'Cartão de Crédito' && (
                    <p className="text-slate-500 mt-1 font-mono">Cartão terminado em **** {cardNumber.slice(-4) || '9999'}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button onClick={handlePrevStep} variant="secondary">
                  Voltar
                </Button>
                <Button onClick={handlePlaceOrder} className="px-8">
                  Confirmar e Finalizar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Success Finalization */}
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
                  Seu pedido foi registrado em nosso sistema fictício de teste.
                </p>
                <span className="text-xs font-mono bg-slate-950 text-indigo-400 px-3.5 py-1.5 rounded-lg border border-slate-850 inline-block mt-3">
                  Código: {createdOrderCode}
                </span>
              </div>

              {paymentMethod === 'Pix' && (
                <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-4">
                  <div className="w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center">
                    {/* Simulated QR Code box */}
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

              {paymentMethod === 'Boleto Bancário' && (
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
                <span className="text-slate-500">Quantidade de Peças</span>
                <span className="font-semibold text-slate-350">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} un.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Valor Bruto</span>
                <span className="font-mono text-slate-300">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Frete</span>
                <span className="font-mono text-slate-300">
                  {shipping === 0 ? 'Grátis' : `R$ ${shipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-200">Total a Pagar</span>
              <span className="text-lg font-black text-white font-mono">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
export default Checkout
