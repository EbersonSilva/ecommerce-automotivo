import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { mockOrders } from '../../mock/mockData'
import type { Order } from '../../mock/mockData'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { ArrowLeft, MapPin, CreditCard, RefreshCcw, Calendar, Receipt, XCircle, CheckCircle2 } from 'lucide-react'

export const OrderDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  
  // Exchange Request State
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [exchangeReason, setExchangeReason] = useState('')

  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('custom-orders')
      const customList = savedCustom ? JSON.parse(savedCustom) : []
      const combined = [...customList, ...mockOrders]
      const found = combined.find((o) => o.id === id)
      setOrder(found || null)
    } catch {
      const found = mockOrders.find((o) => o.id === id)
      setOrder(found || null)
    }
  }, [id])

  const updateOrderStatus = (nextStatus: Order['status']) => {
    if (!order) return
    try {
      const savedCustom = localStorage.getItem('custom-orders')
      const customList: Order[] = savedCustom ? JSON.parse(savedCustom) : []
      
      const foundInCustomIndex = customList.findIndex((o) => o.id === order.id)
      let updatedList: Order[]
      
      if (foundInCustomIndex > -1) {
        customList[foundInCustomIndex].status = nextStatus
        updatedList = [...customList]
      } else {
        const updatedOrder = { ...order, status: nextStatus }
        updatedList = [updatedOrder, ...customList]
      }
      
      localStorage.setItem('custom-orders', JSON.stringify(updatedList))
      setOrder({ ...order, status: nextStatus })
    } catch (err) {
      console.error(err)
      alert('Falha ao atualizar o status do pedido.')
    }
  }

  const handleCancelOrder = () => {
    if (confirm('Tem certeza de que deseja cancelar este pedido?')) {
      updateOrderStatus('CANCELADO')
      alert('Pedido cancelado com sucesso!')
    }
  }

  const handleConfirmReceipt = () => {
    if (confirm('Deseja confirmar o recebimento deste pedido?')) {
      updateOrderStatus('ENTREGUE')
      alert('Recebimento confirmado! O status do pedido foi atualizado para ENTREGUE.')
    }
  }

  const productOptions = useMemo(() => {
    if (!order) return []
    return order.items.map((item) => ({
      value: item.name,
      label: `${item.name} (${item.quantity}x)`
    }))
  }, [order])

  useEffect(() => {
    if (productOptions.length > 0) {
      setSelectedProduct(productOptions[0].value)
    }
  }, [productOptions])

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Pedido não encontrado</h2>
        <p className="text-sm text-slate-500 mb-6">O código do pedido não coincide com nenhum registro.</p>
        <Link to="/pedidos">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pedidos
          </Button>
        </Link>
      </div>
    )
  }

  const handleRequestExchange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!exchangeReason.trim()) {
      alert('Favor preencher o motivo da solicitação de troca.')
      return
    }

    try {
      const savedExchanges = localStorage.getItem('custom-exchanges')
      const exchangeList = savedExchanges ? JSON.parse(savedExchanges) : []
      
      const newExchange = {
        id: `TRO-${Math.floor(5000 + Math.random() * 9000)}`,
        orderId: order.id,
        customerName: order.customerName || 'Cliente Logado',
        product: selectedProduct,
        requestDate: new Date().toISOString().split('T')[0],
        reason: exchangeReason,
        status: 'Pendente'
      }

      exchangeList.unshift(newExchange)
      localStorage.setItem('custom-exchanges', JSON.stringify(exchangeList))
      
      setExchangeReason('')
      
      alert('Solicitação de troca enviada com sucesso!')
      setIsExchangeModalOpen(false)
    } catch (err) {
      console.error(err)
      alert('Falha ao processar solicitação de troca.')
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
      <Breadcrumb 
        items={[
          { label: 'Pedidos', path: '/pedidos' },
          { label: `Detalhes de ${order.id}` }
        ]} 
      />

      <Link 
        to="/pedidos" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a Lista
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-indigo-400 px-3.5 py-1.5 rounded-lg">
            {order.id}
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-3">Detalhes da Compra</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {(order.status === 'EM ABERTO' || order.status === 'EM PROCESSAMENTO') && (
            <Button 
              onClick={handleCancelOrder}
              variant="danger" 
              className="gap-2 text-xs font-bold"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancelar Pedido
            </Button>
          )}

          {order.status === 'EM TRÂNSITO' && (
            <Button 
              onClick={handleConfirmReceipt}
              className="gap-2 text-xs font-bold bg-emerald-605 border-emerald-700 hover:bg-emerald-600 hover:border-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirmar Recebimento
            </Button>
          )}

          {order.status === 'ENTREGUE' && (
            <Button 
              onClick={() => setIsExchangeModalOpen(true)}
              variant="outline" 
              className="gap-2 text-xs font-bold border-indigo-500/30 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Solicitar Devolução / Troca
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 items-start">
        {/* Left Side: Order breakdown list */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-350 uppercase tracking-widest pb-3 border-b border-slate-800 flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-indigo-400" />
              Peças Adquiridas
            </h3>
            
            <div className="divide-y divide-slate-850">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-4.5 flex justify-between items-center text-xs">
                  <div className="text-left">
                    <span className="text-slate-100 font-bold block text-sm">{item.name}</span>
                    <span className="text-slate-550 block mt-1 font-mono">
                      Qtd: {item.quantity} x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="font-mono text-slate-200 font-bold text-sm">
                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-200">Total Faturado</span>
              <span className="text-xl font-black text-white font-mono">
                R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Delivery and metadata cards */}
        <div className="flex flex-col gap-6">
          {/* Metadata Card */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-sm shadow-xl text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Status Atual</span>
              <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Data do Pedido</span>
              <span className="text-slate-300 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {order.date}
              </span>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-sm shadow-xl text-left text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Destinatário e Envio
            </h4>
            <p className="text-slate-300 font-semibold mb-1">{order.customerName}</p>
            <p className="text-slate-400 leading-relaxed">{order.shippingAddress}</p>
          </div>

          {/* Payment Card */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-sm shadow-xl text-left text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Informações de Faturamento
            </h4>
            <p className="text-slate-350">Forma de Pagamento: <strong>{order.paymentMethod}</strong></p>
            <p className="text-slate-500 mt-2">Transação autorizada visualmente para homologação.</p>
          </div>
        </div>
      </div>

      {/* Exchange Modal */}
      <Modal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        title="Solicitar Devolução / Troca"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsExchangeModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleRequestExchange}>
              Confirmar Solicitação
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRequestExchange} className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed mb-2">
            Selecione qual item do pedido deseja devolver e insira o motivo. A solicitação será analisada na central administrativa.
          </p>

          <Select
            label="Escolha a Peça"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            options={productOptions}
          />

          <Input
            label="Motivo da Troca / Devolução"
            placeholder="Descreva o motivo (incompatibilidade, defeito, etc.)"
            value={exchangeReason}
            onChange={(e) => setExchangeReason(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  )
}
export default OrderDetail
