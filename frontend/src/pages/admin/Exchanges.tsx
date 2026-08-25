import { useState, useEffect } from 'react'
import { mockExchanges, mockOrders } from '../../mock/mockData'
import type { Exchange } from '../../mock/mockData'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { RefreshCw, Check, X } from 'lucide-react'

export const Exchanges = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([])

  const loadExchanges = () => {
    try {
      const savedCustom = localStorage.getItem('custom-exchanges')
      let customList = savedCustom ? JSON.parse(savedCustom) : []
      customList = customList.map((ex: any) => ({
        ...ex,
        status: ex.status === 'Pendente' ? 'TROCA SOLICITADA' : ex.status
      }))
      setExchanges([...customList, ...mockExchanges])
    } catch {
      setExchanges(mockExchanges)
    }
  }

  useEffect(() => {
    loadExchanges()
  }, [])

  const handleAction = (exchangeId: string, nextStatus: Exchange['status']) => {
    try {
      const savedCustom = localStorage.getItem('custom-exchanges')
      const customList: Exchange[] = savedCustom ? JSON.parse(savedCustom) : []
      
      const foundInCustom = customList.find((ex) => ex.id === exchangeId)
      
      let updatedExchanges: Exchange[]
      if (foundInCustom) {
        const updatedCustom = customList.map((ex) => {
          if (ex.id === exchangeId) {
            return { ...ex, status: nextStatus }
          }
          return ex
        })
        localStorage.setItem('custom-exchanges', JSON.stringify(updatedCustom))
        const customIds = updatedCustom.map(ex => ex.id)
        updatedExchanges = [...updatedCustom, ...mockExchanges.filter(ex => !customIds.includes(ex.id))]
      } else {
        // Clone mock item and put in custom
        const mockItem = mockExchanges.find(ex => ex.id === exchangeId)
        if (mockItem) {
          const newItem = { ...mockItem, status: nextStatus }
          const updatedCustom = [newItem, ...customList]
          localStorage.setItem('custom-exchanges', JSON.stringify(updatedCustom))
          const customIds = updatedCustom.map(ex => ex.id)
          updatedExchanges = [...updatedCustom, ...mockExchanges.filter(ex => !customIds.includes(ex.id))]
        } else {
          updatedExchanges = exchanges
        }
      }
      
      // LOGIC: If nextStatus is 'TROCA PROCESSADA', automatically generate a coupon!
      if (nextStatus === 'TROCA PROCESSADA') {
        const currentExchange = updatedExchanges.find(ex => ex.id === exchangeId)
        if (currentExchange) {
          // Find order to calculate value (or generate R$ 150.00 mock value if not found)
          let couponValue = 150.00
          let targetCustomerId = '1'
          try {
            const savedOrders = localStorage.getItem('custom-orders')
            const ordersList = savedOrders ? JSON.parse(savedOrders) : []
            const order = ordersList.find((o: any) => o.id === currentExchange.orderId) || mockOrders.find(o => o.id === currentExchange.orderId)
            if (order) {
              const item = order.items.find((i: any) => i.name === currentExchange.product)
              if (item) {
                couponValue = item.price * item.quantity
              }
              targetCustomerId = order.customerId || '1'
            }
          } catch (e) {
            console.error(e)
          }

          // Generate coupon
          const newCoupon = {
            id: `CUP-${Math.floor(1000 + Math.random() * 9000)}`,
            code: `TROCA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            type: 'Troca' as const,
            value: couponValue,
            status: 'Ativo' as const,
            description: `Cupom de troca gerado a partir da troca ${exchangeId} (Pedido ${currentExchange.orderId})`,
            customerId: targetCustomerId
          }

          const savedCoupons = localStorage.getItem('custom-coupons')
          const couponsList = savedCoupons ? JSON.parse(savedCoupons) : []
          couponsList.unshift(newCoupon)
          localStorage.setItem('custom-coupons', JSON.stringify(couponsList))
        }
      }
      
      setExchanges(updatedExchanges)
      alert(`Solicitação de devolução ${exchangeId} foi alterada para "${nextStatus}"!`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Solicitações de Trocas</h1>
        <p className="text-xs text-slate-500 font-medium">Controle de devoluções, trocas e logística reversa de autopeças</p>
      </div>

      {exchanges.length > 0 ? (
        <Table headers={['Código Troca', 'Código Pedido', 'Cliente', 'Produto / Peça', 'Data Solicitação', 'Motivo da Troca', 'Status', 'Ações']}>
          {exchanges.map((ex) => (
            <tr key={ex.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                {ex.id}
              </td>
              <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                {ex.orderId}
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-150">
                {ex.customerName}
              </td>
              <td className="px-6 py-4 text-xs text-slate-100 font-bold max-w-[150px] truncate">
                {ex.product}
              </td>
              <td className="px-6 py-4 text-xs font-mono text-slate-450">
                {ex.requestDate}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={ex.reason}>
                {ex.reason}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(ex.status)}>
                  {ex.status}
                </Badge>
              </td>
              <td className="px-6 py-4 flex gap-1.5 justify-start">
                {ex.status === 'TROCA SOLICITADA' && (
                  <>
                    <Button
                      onClick={() => handleAction(ex.id, 'TROCA ACEITA')}
                      variant="primary"
                      size="sm"
                      className="px-2 py-1 bg-emerald-650 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 text-[10px]"
                      title="Aprovar Troca"
                    >
                      <Check className="w-3 h-3" />
                      Aceitar
                    </Button>
                    <Button
                      onClick={() => handleAction(ex.id, 'TROCA NEGADA')}
                      variant="danger"
                      size="sm"
                      className="px-2 py-1 flex items-center gap-1 text-[10px]"
                      title="Recusar Troca"
                    >
                      <X className="w-3 h-3" />
                      Negar
                    </Button>
                  </>
                )}

                {ex.status === 'ITEM ENVIADO' && (
                  <Button
                    onClick={() => handleAction(ex.id, 'ITEM RECEBIDO')}
                    variant="primary"
                    size="sm"
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 text-[10px]"
                    title="Confirmar Recebimento"
                  >
                    <Check className="w-3 h-3" />
                    Receber Item
                  </Button>
                )}

                {ex.status === 'ITEM RECEBIDO' && (
                  <Button
                    onClick={() => handleAction(ex.id, 'TROCA PROCESSADA')}
                    variant="primary"
                    size="sm"
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[10px]"
                    title="Processar Troca e Gerar Cupom"
                  >
                    <Check className="w-3 h-3" />
                    Processar
                  </Button>
                )}

                {ex.status === 'TROCA ACEITA' && (
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">Aguardando Envio</span>
                )}
                {ex.status === 'TROCA NEGADA' && (
                  <span className="text-[10px] text-rose-500 font-bold uppercase">Negada</span>
                )}
                {ex.status === 'TROCA PROCESSADA' && (
                  <span className="text-[10px] text-emerald-450 font-bold uppercase">Concluída / Cupom Gerado</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center">
          <RefreshCw className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-spin-slow" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhuma solicitação pendente</h3>
          <p className="text-xs text-slate-500">A fila de trocas e devoluções encontra-se vazia.</p>
        </div>
      )}
    </div>
  )
}
export default Exchanges
