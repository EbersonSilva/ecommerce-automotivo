import { useState, useEffect } from 'react'
import { mockOrders } from '../../mock/mockData'
import type { Order } from '../../mock/mockData'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { ClipboardList } from 'lucide-react'

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('custom-orders')
      const customList = savedCustom ? JSON.parse(savedCustom) : []
      setOrders([...customList, ...mockOrders])
    } catch {
      setOrders(mockOrders)
    }
  }, [])

  const handleStatusChange = (orderId: string, nextStatus: any) => {
    try {
      const savedCustom = localStorage.getItem('custom-orders')
      const customList: Order[] = savedCustom ? JSON.parse(savedCustom) : []
      
      const foundInCustom = customList.find((o) => o.id === orderId)
      
      let updatedOrders: Order[]
      if (foundInCustom) {
        // Update custom orders list in localStorage
        const updatedCustom = customList.map((o) => {
          if (o.id === orderId) {
            return { ...o, status: nextStatus }
          }
          return o
        })
        localStorage.setItem('custom-orders', JSON.stringify(updatedCustom))
        updatedOrders = [...updatedCustom, ...mockOrders]
      } else {
        // Update standard mock order in local component state
        updatedOrders = orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, status: nextStatus }
          }
          return o
        })
      }
      
      setOrders(updatedOrders)
      alert(`Status do pedido ${orderId} atualizado para "${nextStatus}"!`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Pedidos Recebidos</h1>
        <p className="text-xs text-slate-500 font-medium">Acompanhe faturamentos, entregas e despachos de mercadorias</p>
      </div>

      {orders.length > 0 ? (
        <Table headers={['Número', 'Cliente', 'Data', 'Valor Total', 'Pagamento', 'Status do Pedido', 'Alterar Status']}>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-bold text-slate-200">
                {o.id}
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-100">
                {o.customerName}
              </td>
              <td className="px-6 py-4 text-xs font-mono text-slate-400">
                {o.date}
              </td>
              <td className="px-6 py-4 font-mono text-slate-200 text-xs font-bold">
                R$ {o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 text-xs text-slate-450">
                {o.paymentMethod}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(o.status)}>
                  {o.status}
                </Badge>
              </td>
              <td className="px-6 py-4 max-w-[160px]">
                <Select
                  value={o.status}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  options={[
                    { value: 'Pendente', label: 'Pendente' },
                    { value: 'Pago', label: 'Pago' },
                    { value: 'Enviado', label: 'Enviado' },
                    { value: 'Entregue', label: 'Entregue' },
                    { value: 'Cancelado', label: 'Cancelado' }
                  ]}
                  className="py-1 px-2.5 text-xs rounded-lg"
                />
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhum pedido faturado</h3>
          <p className="text-xs text-slate-500">Nenhum pedido recebido nas contas.</p>
        </div>
      )}
    </div>
  )
}
export default Orders
